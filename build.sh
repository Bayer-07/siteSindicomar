#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

MODE="${1:-full}"

log() {
  printf '[build] %s\n' "$*"
}

die() {
  printf '[build] ERRO: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'HELP'
Uso:
  ./build.sh                  prepara, migra, compila e inicia em produção
  ./build.sh build-only       prepara, migra, compila e encerra
  ./build.sh prepare-only     instala, sobe/verifica o PostgreSQL, migra e cria o admin
  ./build.sh start-only       inicia apenas o build já existente

Variáveis opcionais:
  POSTGRES_AUTO_START=true   inicia o PostgreSQL pelo docker-compose.postgres.yml
  SEED_DEMO=true              carrega o conteúdo demonstrativo
  RUN_CHECKS=true             executa typecheck, lint e testes antes do build
  SKIP_INSTALL=true           não executa npm ci
  ALLOW_RELATIVE_UPLOADS=true permite UPLOADS_DIR relativo (somente desenvolvimento)
  ALLOW_RELATIVE_DATA=true    permite POSTGRES_DATA_DIR relativo (somente desenvolvimento)
HELP
}

load_env_file() {
  local file="$1"
  local line key value
  [[ -f "$file" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      value="${BASH_REMATCH[2]}"
      if [[ "$value" == \"*\" && "$value" == *\" ]]; then
        value="${value:1:${#value}-2}"
      elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
        value="${value:1:${#value}-2}"
      fi
      [[ -n "${!key+x}" ]] || export "$key=$value"
    fi
  done < "$file"
}

load_env_file "$ROOT_DIR/.env.production.local"
load_env_file "$ROOT_DIR/.env.development.local"
load_env_file "$ROOT_DIR/.env.local"
load_env_file "$ROOT_DIR/.env"

APP_HOST="${APP_HOST:-0.0.0.0}"
APP_PORT="${PORT:-3000}"
DB_WAIT_ATTEMPTS="${DB_WAIT_ATTEMPTS:-30}"
POSTGRES_COMPOSE_FILE="${POSTGRES_COMPOSE_FILE:-$ROOT_DIR/docker-compose.postgres.yml}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-sindicomar-postgres}"
POSTGRES_DATA_DIR="${POSTGRES_DATA_DIR:-/srv/sindicomar/postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

require_env() {
  local key="$1"
  [[ -n "${!key:-}" ]] || die "Variável obrigatória não configurada: $key"
}

validate_environment() {
  export NODE_ENV=production
  export DEMO_MODE="${DEMO_MODE:-false}"
  require_env DATABASE_URL
  require_env NEXT_PUBLIC_SITE_URL
  require_env ADMIN_EMAIL
  require_env AUTH_SESSION_SECRET
  require_env AUTH_ENCRYPTION_KEY
  require_env UPLOADS_DIR
  require_env FORM_NOTIFICATION_EMAIL
  [[ "$DATABASE_URL" =~ ^postgres(ql)?:// ]] || die "DATABASE_URL precisa usar PostgreSQL (postgresql://...)."
  [[ "$DEMO_MODE" == "false" ]] || die "DEMO_MODE precisa ser false em produção."
  [[ "$UPLOADS_DIR" == /* || "${ALLOW_RELATIVE_UPLOADS:-false}" == "true" ]] || die "UPLOADS_DIR precisa ser absoluto em produção. Use ALLOW_RELATIVE_UPLOADS=true apenas localmente."
  if [[ "${POSTGRES_AUTO_START:-false}" == "true" ]]; then
    [[ "$POSTGRES_DATA_DIR" == /* || "${ALLOW_RELATIVE_DATA:-false}" == "true" ]] || die "POSTGRES_DATA_DIR precisa ser absoluto em produção."
  fi

  local transport="${EMAIL_TRANSPORT:-}"
  case "${transport,,}" in
    gmail|smtp)
      require_env SMTP_USER
      require_env SMTP_PASS
      ;;
    resend)
      require_env RESEND_API_KEY
      require_env RESEND_FROM_EMAIL
      ;;
    *)
      die "EMAIL_TRANSPORT deve ser gmail, smtp ou resend."
      ;;
  esac

  if [[ -n "${NEXT_PUBLIC_TURNSTILE_SITE_KEY:-}" || -n "${TURNSTILE_SECRET_KEY:-}" ]]; then
    require_env NEXT_PUBLIC_TURNSTILE_SITE_KEY
    require_env TURNSTILE_SECRET_KEY
  fi
  if ! [[ "$APP_PORT" =~ ^[0-9]+$ ]] || (( APP_PORT < 1 || APP_PORT > 65535 )); then
    die "PORT precisa ser um número entre 1 e 65535."
  fi
}

install_dependencies() {
  if [[ "${SKIP_INSTALL:-false}" == "true" ]]; then
    log "SKIP_INSTALL=true; mantendo node_modules existente."
  elif [[ -f "$ROOT_DIR/package-lock.json" ]]; then
    log "Instalando dependências com npm ci (incluindo devDependencies para o build)."
    npm ci --include=dev
  else
    log "package-lock.json não encontrado; usando npm install."
    npm install
  fi
}

start_postgres_if_requested() {
  [[ "${POSTGRES_AUTO_START:-false}" == "true" ]] || {
    log "POSTGRES_AUTO_START não está ativo; usando o PostgreSQL fornecido pelo servidor."
    return 0
  }
  command -v docker >/dev/null 2>&1 || die "POSTGRES_AUTO_START=true, mas o comando docker não está instalado."
  require_env POSTGRES_DB
  require_env POSTGRES_USER
  require_env POSTGRES_PASSWORD
  [[ -f "$POSTGRES_COMPOSE_FILE" ]] || die "Compose PostgreSQL não encontrado: $POSTGRES_COMPOSE_FILE"
  mkdir -p "$POSTGRES_DATA_DIR" || die "Não foi possível criar POSTGRES_DATA_DIR: $POSTGRES_DATA_DIR"
  log "Iniciando o container PostgreSQL: $POSTGRES_CONTAINER."
  POSTGRES_CONTAINER="$POSTGRES_CONTAINER" POSTGRES_DATA_DIR="$POSTGRES_DATA_DIR" POSTGRES_PORT="$POSTGRES_PORT" \
    docker compose -f "$POSTGRES_COMPOSE_FILE" up -d postgres
}

wait_for_database() {
  log "Aguardando conexão com o PostgreSQL."
  export DB_WAIT_ATTEMPTS
  node --input-type=module - <<'NODE'
import pg from "pg";
const attempts = Number(process.env.DB_WAIT_ATTEMPTS ?? 30);
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 3000,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
});
let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    const connection = await pool.connect();
    await connection.query("SELECT 1");
    connection.release();
    await pool.end();
    console.log("PostgreSQL disponível.");
    process.exit(0);
  } catch (error) {
    lastError = error;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
await pool.end();
console.error("PostgreSQL indisponível após " + attempts + " tentativas: " + (lastError instanceof Error ? lastError.message : "erro desconhecido"));
process.exit(1);
NODE
}

prepare_database() {
  mkdir -p "$UPLOADS_DIR"
  local probe="$UPLOADS_DIR/.sindicomar-write-test"
  touch "$probe" || die "UPLOADS_DIR não permite gravação: $UPLOADS_DIR"
  rm -f "$probe"
  start_postgres_if_requested
  wait_for_database
  if [[ -n "${POSTGRES_ADMIN_URL:-}" ]]; then
    log "Garantindo roles PostgreSQL e a extensão pgcrypto."
    npm run db:provision-roles
  fi
  log "Aplicando migrations PostgreSQL."
  npm run db:migrate
  if [[ "${SEED_DEMO:-false}" == "true" ]]; then
    log "Carregando conteúdo demonstrativo."
    npm run db:seed
  fi
  log "Garantindo administrador sem resetar senha existente."
  npm run db:ensure-admin
}

run_checks() {
  [[ "${RUN_CHECKS:-false}" == "true" ]] || return 0
  log "Executando typecheck."
  npm run typecheck
  log "Executando lint."
  npm run lint
  log "Executando testes."
  npm test
}

build_application() {
  run_checks
  log "Gerando build de produção."
  npm run build
}

start_application() {
  log "Iniciando Next.js em produção em $APP_HOST:$APP_PORT."
  exec npm run start -- --hostname "$APP_HOST" --port "$APP_PORT"
}

case "$MODE" in
  full)
    validate_environment
    install_dependencies
    prepare_database
    build_application
    start_application
    ;;
  build-only)
    validate_environment
    install_dependencies
    prepare_database
    build_application
    ;;
  prepare-only)
    validate_environment
    install_dependencies
    prepare_database
    ;;
  start-only)
    validate_environment
    start_application
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage
    die "Modo desconhecido: $MODE"
    ;;
esac

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
  ./build.sh prepare-only     instala, sobe/verifica o banco, migra e cria o admin
  ./build.sh start-only       inicia apenas o build já existente

Variáveis opcionais:
  MYSQL_AUTO_START=true       inicia/cria um MySQL Docker local
  SEED_DEMO=true              carrega o conteúdo demonstrativo
  RUN_CHECKS=true              executa typecheck, lint e testes antes do build
  SKIP_INSTALL=true            não executa npm ci
  ALLOW_RELATIVE_UPLOADS=true permite UPLOADS_DIR relativo (somente desenvolvimento)
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

# Hostinger supplies variables through hPanel. These files make the same
# script useful on a VPS or in a local production-like environment.
load_env_file "$ROOT_DIR/.env.production.local"
load_env_file "$ROOT_DIR/.env.development.local"
load_env_file "$ROOT_DIR/.env.local"
load_env_file "$ROOT_DIR/.env"

APP_HOST="${APP_HOST:-0.0.0.0}"
APP_PORT="${PORT:-3000}"
DB_WAIT_ATTEMPTS="${DB_WAIT_ATTEMPTS:-30}"
MYSQL_CONTAINER_NAME="${MYSQL_CONTAINER_NAME:-sindicomar-mysql}"
MYSQL_IMAGE="${MYSQL_IMAGE:-mysql:8.4}"
MYSQL_PORT="${MYSQL_PORT:-3307}"
MYSQL_VOLUME="${MYSQL_VOLUME:-sindicomar_mysql_data}"

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

  [[ "$DEMO_MODE" == "false" ]] || die "DEMO_MODE precisa ser false em produção."
  [[ "$UPLOADS_DIR" == /* || "${ALLOW_RELATIVE_UPLOADS:-false}" == "true" ]] || die "UPLOADS_DIR precisa ser absoluto em produção. Use ALLOW_RELATIVE_UPLOADS=true apenas localmente."

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
    log "Instalando dependências com npm ci."
    npm ci
  else
    log "package-lock.json não encontrado; usando npm install."
    npm install
  fi
}

start_mysql_if_requested() {
  [[ "${MYSQL_AUTO_START:-false}" == "true" ]] || {
    log "MYSQL_AUTO_START não está ativo; usando o MySQL já fornecido pelo servidor."
    return 0
  }

  command -v docker >/dev/null 2>&1 || die "MYSQL_AUTO_START=true, mas o comando docker não está instalado."
  require_env MYSQL_DATABASE
  require_env MYSQL_USER
  require_env MYSQL_PASSWORD
  require_env MYSQL_ROOT_PASSWORD

  if docker inspect "$MYSQL_CONTAINER_NAME" >/dev/null 2>&1; then
    local running
    running="$(docker inspect --format '{{.State.Running}}' "$MYSQL_CONTAINER_NAME")"
    if [[ "$running" != "true" ]]; then
      log "Iniciando o container MySQL existente: $MYSQL_CONTAINER_NAME."
      docker start "$MYSQL_CONTAINER_NAME" >/dev/null
    else
      log "Container MySQL já está em execução: $MYSQL_CONTAINER_NAME."
    fi
    return 0
  fi

  log "Criando o container MySQL: $MYSQL_CONTAINER_NAME."
  docker volume create "$MYSQL_VOLUME" >/dev/null
  docker run --name "$MYSQL_CONTAINER_NAME" --restart unless-stopped \
    -e "MYSQL_DATABASE=$MYSQL_DATABASE" \
    -e "MYSQL_USER=$MYSQL_USER" \
    -e "MYSQL_PASSWORD=$MYSQL_PASSWORD" \
    -e "MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD" \
    -p "$MYSQL_PORT:3306" \
    -v "$MYSQL_VOLUME:/var/lib/mysql" \
    -d "$MYSQL_IMAGE" >/dev/null
}

wait_for_database() {
  log "Aguardando conexão com o MySQL."
  export DB_WAIT_ATTEMPTS
  node --input-type=module - <<'NODE'
import mysql from "mysql2/promise";

const attempts = Number(process.env.DB_WAIT_ATTEMPTS ?? 30);
let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL, timezone: "Z" });
    await connection.ping();
    await connection.end();
    console.log("MySQL disponível.");
    process.exit(0);
  } catch (error) {
    lastError = error;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
console.error(`MySQL indisponível após ${attempts} tentativas: ${lastError instanceof Error ? lastError.message : "erro desconhecido"}`);
process.exit(1);
NODE
}

prepare_database() {
  mkdir -p "$UPLOADS_DIR"
  local probe="$UPLOADS_DIR/.sindicomar-write-test"
  touch "$probe" || die "UPLOADS_DIR não permite gravação: $UPLOADS_DIR"
  rm -f "$probe"

  start_mysql_if_requested
  wait_for_database

  log "Aplicando migrações MySQL."
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

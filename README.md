# Portal Sindicomar

Portal institucional e de serviços do Sindicomar, construído com Next.js, React, TypeScript, Tailwind e PostgreSQL. O painel administrativo usa senha + TOTP/MFA. O conteúdo trabalhista que acompanha o código é demonstrativo até a aprovação do Sindicato.

## Requisitos

- Node.js 24.x
- npm
- Docker Desktop (local) ou Docker Engine + Compose (servidor)
- PostgreSQL 16 (o projeto pode iniciá-lo pelo Compose)

## Configuração local

1. Copie .env.example para .env.development.local.
2. Preencha ADMIN_EMAIL, AUTH_SESSION_SECRET, AUTH_ENCRYPTION_KEY e o transporte de e-mail.
3. Para o PostgreSQL Docker local, use:

    POSTGRES_AUTO_START=true
    POSTGRES_DB=sindicomar
    POSTGRES_USER=app_user
    POSTGRES_PASSWORD=uma-senha-local-forte
    POSTGRES_PORT=5433
    POSTGRES_DATA_DIR=./.postgres-data
    DATABASE_URL=postgresql://app_user:uma-senha-local-forte@127.0.0.1:5433/sindicomar
    DATABASE_MIGRATION_URL=postgresql://app_user:uma-senha-local-forte@127.0.0.1:5433/sindicomar
    DATABASE_SSL=false
    UPLOADS_DIR=./.local-uploads
    ALLOW_RELATIVE_UPLOADS=true
    ALLOW_RELATIVE_DATA=true

4. Execute bash build.sh build-only para instalar dependências, iniciar o PostgreSQL, aplicar migrations, garantir o administrador e gerar o build.
5. Execute npm run start para abrir a versão de produção em http://localhost:3000.

Para desenvolvimento com recarga automática, use npm run dev depois de executar as migrations.

## Scripts principais

- npm run db:migrate: aplica as migrations PostgreSQL de forma idempotente.
- npm run db:generate: gera uma nova migration a partir do schema Drizzle; revise o SQL antes de publicar.
- npm run db:seed: insere o conteúdo demonstrativo sem duplicar registros.
- npm run db:ensure-admin: cria o administrador apenas se ele ainda não existir.
- npm run db:create-admin: cria ou redefine a senha do administrador.
- npm run db:check: valida tabelas, migrations, pgcrypto e a remoção da tabela de alertas.
- npm run db:backup: cria um dump PostgreSQL compactado em backups usando o usuário de migração/administração.
- npm run db:restore -- arquivo.dump: restaura um dump dentro de POSTGRES_BACKUP_DIR somente com CONFIRM_RESTORE=YES, usando o usuário de migração/administração.
- npm run typecheck, npm run lint, npm test e npm run build: validações do projeto.

## Migração do MySQL existente

O MySQL permanece apenas como origem durante a transição. Faça backup do banco e do diretório de uploads antes de iniciar.

Defina temporariamente:

    MYSQL_SOURCE_URL=mysql://usuario:senha@host:3306/sindicomar
    POSTGRES_DATABASE_URL=postgresql://migration_user:senha@127.0.0.1:5432/sindicomar
    MYSQL_UPLOADS_DIR=/caminho/para/uploads-antigos
    UPLOADS_DIR=/srv/sindicomar/uploads

Faça primeiro um ensaio sem gravar:

    npm run db:migrate:mysql-to-postgres -- --dry-run

Depois execute a migração:

    npm run db:migrate:mysql-to-postgres

O script importa todas as tabelas atuais, preserva IDs e relacionamentos, converte JSON/booleanos/timestamps, valida UUIDs e JSON, compara quantidades e verifica hashes dos arquivos. As sessões administrativas são invalidadas após a importação; o administrador, TOTP, códigos de recuperação, auditoria e solicitações são preservados.

mysql2 existe somente como dependência de desenvolvimento para esta migração única. Depois da conferência final, ele pode ser removido do package.json e do package-lock.json.

## Produção no Ubuntu

Estrutura recomendada:

    /srv/sindicomar/
    ├── app/
    ├── postgres/
    ├── uploads/
    ├── backups/
    └── .env.production.local

No arquivo de ambiente de produção, use DATABASE_URL com o usuário da aplicação e DATABASE_MIGRATION_URL com o usuário reservado para deploy. Use POSTGRES_DATA_DIR=/srv/sindicomar/postgres, UPLOADS_DIR=/srv/sindicomar/uploads e POSTGRES_PORT=5432.

Antes do primeiro build, crie os diretórios persistentes e dê ao processo do PostgreSQL (UID 999 na imagem oficial) acesso ao diretório de dados:

    sudo mkdir -p /srv/sindicomar/postgres /srv/sindicomar/uploads /srv/sindicomar/backups
    sudo chown -R 999:999 /srv/sindicomar/postgres

Na primeira configuração, informe também POSTGRES_ADMIN_URL e os nomes/senhas de POSTGRES_APP_USER e POSTGRES_MIGRATION_USER. Provisione os dois usuários e a extensão pgcrypto uma única vez antes de aplicar as migrations:

    npm run db:provision-roles

Depois, deixe DATABASE_URL apontando para o usuário da aplicação e DATABASE_MIGRATION_URL para o usuário de migração. O navegador nunca recebe nenhuma dessas URLs. Se POSTGRES_ADMIN_URL permanecer no ambiente durante o primeiro build, o build.sh repete essa provisão de forma idempotente; depois ela pode ser removida do ambiente de execução.

Suba o banco:

    docker compose --env-file .env.production.local -f docker-compose.postgres.yml up -d postgres
    npm run db:migrate
    npm run db:check
    npm run build

O arquivo deploy/sindicomar.service mantém o Next.js ativo via systemd. Copie-o para /etc/systemd/system/, ajuste o usuário e o diretório do projeto, e execute:

    sudo systemctl daemon-reload
    sudo systemctl enable --now sindicomar

O Nginx deve encaminhar HTTPS para 127.0.0.1:3000. Um exemplo está em deploy/nginx/sindicomar.conf.

## Backup e restauração

Execute diariamente:

    npm run db:backup
    tar -czf backups/uploads-$(date +%F).tar.gz -C /srv/sindicomar uploads

Mantenha cópias fora do servidor e teste a restauração mensalmente em uma base descartável:

    CONFIRM_RESTORE=YES RESTORE_DATABASE_URL=postgresql://... npm run db:restore -- sindicomar-AAAA-MM-DD.dump

Nunca exponha a porta do PostgreSQL publicamente, nem coloque arquivos .env*, dumps ou uploads no Git.

## Build automatizado

build.sh possui três modos úteis:

- build-only: prepara banco, migrations e build, sem iniciar o servidor;
- prepare-only: prepara PostgreSQL, migrations e administrador;
- full: executa a preparação, gera o build e inicia o Next.js.

Em produção, prefira executar build.sh build-only durante o deploy e reiniciar o serviço systemd após a validação. O build instala temporariamente as devDependencies necessárias para compilar; depois do corte definitivo, remova a ferramenta mysql2 de migração e execute npm install --package-lock-only para atualizar o lockfile antes do próximo deploy.

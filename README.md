# Portal Sindicomar

Aplicação do portal institucional e de serviços do Sindicomar. O projeto usa Next.js, React, TypeScript e MySQL, com painel administrativo protegido por senha e TOTP/MFA. Os conteúdos trabalhistas que acompanham o código são demonstrativos até a validação do Sindicato.

## Requisitos

- Node.js 24.x e npm;
- MySQL 8.x (local ou hospedado);
- Docker Desktop, opcional para executar o MySQL localmente;
- uma conta SMTP (Gmail/Google Workspace) ou Resend para os e-mails;
- Cloudflare Turnstile, opcional em desenvolvimento e recomendado em produção.

## Executar localmente

### 1. Instalar e configurar

Na pasta `portal`:

```bash
npm install
```

Copie `.env.example` para `.env.local` e preencha as variáveis. Nunca versionar arquivos `.env`.

Para um MySQL local com Docker, por exemplo:

```bash
docker volume create sindicomar_mysql_data
docker run --name sindicomar-mysql --restart unless-stopped \
  -e MYSQL_DATABASE=sindicomar \
  -e MYSQL_USER=sindicomar \
  -e MYSQL_PASSWORD=troque-esta-senha \
  -e MYSQL_ROOT_PASSWORD=troque-esta-senha-root \
  -p 3307:3306 \
  -v sindicomar_mysql_data:/var/lib/mysql \
  -d mysql:8.4
```

Use no `.env.local` a URL correspondente, por exemplo:

```env
DATABASE_URL=mysql://sindicomar:troque-esta-senha@127.0.0.1:3307/sindicomar
```

### 2. Criar tabelas, conteúdo e administrador

```bash
npm run db:migrate
npm run db:seed              # somente conteúdo demonstrativo/aprovado
npm run db:create-admin
```

`db:create-admin` usa `ADMIN_EMAIL` e `ADMIN_INITIAL_PASSWORD`. Se a senha não estiver definida, o script solicita uma senha no terminal; ela deve ter pelo menos 12 caracteres. Depois do primeiro login, cadastre o TOTP/MFA no aplicativo autenticador. `ADMIN_INITIAL_PASSWORD` pode ser removida após a criação do administrador.

### 3. Subir o serviço

Desenvolvimento, com recarregamento automático:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). O painel fica em [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

Produção local:

```bash
npm run build
npm run start
```

O comando `start` deve ser executado somente depois do `build`. Para trocar a porta, use a variável `PORT` ou os argumentos aceitos pelo Next.js.

### Automação com `build.sh`

Em um servidor Linux, VPS ou terminal SSH, o script automatiza a preparação do ambiente, a migração do banco, a criação idempotente do administrador, o build e a inicialização do Next.js:

```bash
chmod +x build.sh
./build.sh
```

O modo padrão (`full`) mantém o serviço rodando em primeiro plano. Outros modos:

```bash
./build.sh prepare-only   # dependências, banco, migração e administrador
./build.sh build-only     # preparação + build, sem iniciar o servidor
./build.sh start-only     # inicia um build já preparado
```

Para usar um MySQL Docker gerenciado pelo próprio script, defina `MYSQL_AUTO_START=true`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` e `MYSQL_ROOT_PASSWORD`. Em hospedagens que já fornecem MySQL, mantenha `MYSQL_AUTO_START=false` e informe apenas `DATABASE_URL`.

Em um Node.js Web App da Hostinger, use `bash build.sh build-only` como comando de build e `bash build.sh start-only` como comando de inicialização. Não use o modo `full` no comando de build da Hostinger, pois ele mantém o processo aberto. Defina `ADMIN_INITIAL_PASSWORD` somente no primeiro deploy, quando o administrador ainda não existir; os deploys seguintes preservam a senha existente. Para rodar typecheck, lint e testes antes do build, defina `RUN_CHECKS=true`.

## Variáveis de ambiente

Variáveis mínimas para produção:

```env
DATABASE_URL=mysql://usuario:senha@host:3306/sindicomar
NEXT_PUBLIC_SITE_URL=https://www.sindicomar.com.br
ADMIN_EMAIL=administrador@exemplo.com
AUTH_SESSION_SECRET=segredo-aleatorio-com-pelo-menos-32-caracteres
AUTH_ENCRYPTION_KEY=chave-aleatoria-de-32-bytes-em-hexadecimal
UPLOADS_DIR=/caminho/persistente/uploads
FORM_NOTIFICATION_EMAIL=sindicomarmarechal@gmail.com
```

Para enviar por Gmail/Google Workspace:

```env
EMAIL_TRANSPORT=gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=conta-de-envio@gmail.com
SMTP_PASS=senha-de-aplicativo-sem-espacos
SMTP_FROM_EMAIL=conta-de-envio@gmail.com
```

Cada formulário tenta enviar duas mensagens: o aviso de nova solicitação para `FORM_NOTIFICATION_EMAIL` e a confirmação para o e-mail informado pelo solicitante. Se uma entrega falhar, a outra continua sendo tentada e a solicitação permanece no painel.

Para usar Resend em vez de SMTP, defina `EMAIL_TRANSPORT=resend`, `RESEND_API_KEY` e `RESEND_FROM_EMAIL` com um remetente de domínio verificado.

As variáveis `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY` ativam a proteção antispam. Depois da migração, remova as variáveis do Supabase do ambiente de produção.

## Publicar na Hostinger

O projeto deve ser criado no hPanel como **Node.js Web App**. A disponibilidade desse recurso depende do plano contratado; se essa opção não aparecer no hPanel, o plano não atende a esta aplicação. Consulte a [documentação oficial de implantação de aplicações Node.js na Hostinger](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/).

### 1. Preparar o MySQL

1. Crie o banco e o usuário MySQL no hPanel.
2. Anote host, porta, nome do banco, usuário e senha.
3. Monte `DATABASE_URL` com esses dados.
4. Configure `UPLOADS_DIR` em uma pasta persistente fora do diretório que será substituído por novos deploys.

### 2. Criar e configurar o aplicativo

No hPanel, conecte o repositório GitHub ou envie o projeto compactado. Use:

- framework: Next.js;
- Node.js: 24.x;
- diretório raiz: a pasta que contém `package.json`;
- comando de build: `npm run build`;
- comando de inicialização: `npm run start`;
- variáveis de ambiente: as mesmas usadas em produção, sem colocar segredos no repositório.

Depois de salvar as variáveis, faça um novo deploy. A Hostinger substitui os arquivos do deploy anterior, portanto não salve uploads dentro da pasta do projeto. O banco e a pasta indicada por `UPLOADS_DIR` precisam permanecer fora do diretório temporário de cada release.

### 3. Inicializar o banco e o administrador

Execute no terminal/SSH da hospedagem, na raiz do projeto:

```bash
npm run db:migrate
npm run db:create-admin
```

Execute `npm run db:seed` somente se o conteúdo demonstrativo ou aprovado estiver pronto para ser carregado. Em seguida, faça login em `/admin/login` e configure o TOTP/MFA.

### 4. Domínio e HTTPS

1. Adicione `sindicomar.com.br` e `www.sindicomar.com.br` no aplicativo da Hostinger.
2. No Registro.br, altere apenas os registros DNS indicados pela Hostinger.
3. Preserve os registros MX e TXT usados pelo Google Workspace.
4. Ative o HTTPS e confirme o redirecionamento para o domínio principal.

## Migração do Supabase

Faça um backup antes da migração. Para uma migração única, mantenha temporariamente `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` disponíveis no ambiente de execução e rode:

```bash
npm run db:migrate:supabase
```

O script copia registros e arquivos para o MySQL e para `UPLOADS_DIR`. Depois de conferir quantidades, arquivos, notícias, parceiros, documentos, agenda e solicitações, remova as variáveis do Supabase do ambiente de produção.

## Segurança e operação

- O acesso ao MySQL ocorre somente no servidor; nenhuma chave administrativa vai para o navegador.
- O painel usa sessão HTTP-only, senha com hash, TOTP obrigatório e códigos de recuperação.
- PDFs e imagens são validados por tipo e tamanho; PDFs têm limite de 20 MB e imagens, 10 MB.
- Nunca sobrescreva arquivos de produção manualmente; faça backup antes de trocar hospedagem ou domínio.
- Configure backups do MySQL e teste a restauração periodicamente.
- Em produção, use `DEMO_MODE=false` e publique apenas conteúdo aprovado pelo Sindicomar.

## Testes antes do deploy

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e       # com o servidor local ativo
```

Antes de apontar o domínio, valide login/MFA, criação e edição no admin, publicação, upload e leitura de PDF, imagens de notícias e parceiros, formulários, protocolo, busca, agenda e geração de calendário `.ics`.

## Conteúdo ainda necessário

- diretoria, cargos e mandato;
- base territorial, categorias e CNAEs;
- CCTs, ACTs, termos, atas, circulares e comunicados atuais;
- serviços, benefícios, parceiros e condições vigentes;
- endereço, horários, WhatsApp e e-mail final dos formulários;
- fotos locais autorizadas;
- revisão jurídica das páginas legais.

# Portal Sindicomar

Aplicação do novo portal institucional e de serviços do Sindicomar. A interface pública, biblioteca de documentos, agenda, notícias, serviços, formulários, autenticação administrativa e estrutura de banco já estão implementadas. Os dados trabalhistas atuais são apenas demonstrativos até a validação do Sindicato.

## Executar localmente

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env.local` e preencha as chaves disponíveis.
3. Execute `npm run dev`.
4. Abra `http://localhost:3000`.

Sem Supabase e Resend, o portal público funciona em modo de homologação. Em desenvolvimento, formulários geram um protocolo demonstrativo; em produção, eles ficam indisponíveis até o banco estar configurado para evitar perda de dados.

## Banco e segurança

Execute `supabase/migrations/202608280001_initial_schema.sql` no projeto Supabase. Depois, cadastre o único administrador:

```sql
insert into public.admin_allowlist (email) values ('administrador@exemplo.com');
```

Use o mesmo e-mail em `ADMIN_EMAIL`. O painel exige magic link e TOTP/MFA. A chave `SUPABASE_SERVICE_ROLE_KEY` é exclusiva do servidor e nunca deve usar o prefixo `NEXT_PUBLIC_`.

## Conteúdo ainda necessário

- diretoria, cargos e mandato;
- base territorial, categorias e CNAEs;
- CCTs, ACTs, termos, atas, circulares e comunicados atuais;
- serviços, benefícios, parceiros e condições vigentes;
- endereço, horários, WhatsApp e e-mail final dos formulários;
- fotos locais autorizadas;
- revisão jurídica das páginas legais.

## Verificações

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:e2e` com o servidor local ativo

# Publicar o convite (Vercel + Supabase)

Guia para a sessão de publicação. Tudo já funciona em local; aqui só se liga a base de dados real e o alojamento.

## 0. Antes de começar

- Abrir uma **sessão nova** do Claude Code nesta pasta, com os plugins `supabase` e `vercel` ligados no `.claude/settings.json` do projecto (estão desligados por omissão).
- Confirmar que o repositório no GitHub continua **privado**.

## 1. Supabase

1. Criar um projecto novo, numa região perto de Angola (ex.: `eu-west` ou `eu-central`).
2. No **SQL Editor**, colar todo o ficheiro `supabase/instalar.sql` e carregar em **Run** (são as migrações `0001` e `0002` juntas). Isto:
   - cria as tabelas `guests`, `event_settings` e `rsvp_log`;
   - acrescenta os campos do convite único (dispositivos e entrada à porta);
   - **activa o RLS sem políticas** e retira as permissões a `anon` e `authenticated`, para que só a chave de serviço (no servidor) consiga ler e escrever.
3. Copiar o **Project URL** e a **service_role key** (Settings → API). A service_role **nunca** vai para o browser nem para o GitHub.

## 2. Segredos

```bash
npm run secrets
```

```bash
npm run hash-password -- "1234"
```

- `secrets` gera `TOKEN_ENC_KEY` e `SESSION_SECRET`.
- `hash-password` gera `ADMIN_PASSWORD_HASH` (formato `scrypt:salt:hash`).
- Usar valores **novos** em produção e não reaproveitar os de `.env.local`.
- Guardar o PIN do admin num sítio seguro. Entrar dura 30 dias por aparelho; depois de 10 PINs errados em 24 h o painel bloqueia até ao dia seguinte (para desbloquear antes: Supabase → Table Editor → `admin_login_fails` → apagar as linhas).

## 3. Vercel

1. Importar o repositório `KazenWilver/sister-convite` (Root Directory: a raiz do repo).
2. Variáveis de ambiente (Production):

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | o endereço final, ex. `https://juceline.vercel.app` (sem `/` no fim) |
| `SUPABASE_URL` | Project URL do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `TOKEN_ENC_KEY` | de `npm run secrets` |
| `SESSION_SECRET` | de `npm run secrets` |
| `ADMIN_PASSWORD_HASH` | de `npm run hash-password` |

3. Fazer o deploy.
   - Sem `SUPABASE_*` o site recusa arrancar na Vercel, de propósito, para nunca usar a base local.
   - As páginas `/dev/*` dão 404 em produção.

> ⚠️ Não mudar a `TOKEN_ENC_KEY` depois de gerar os links: o admin deixaria de conseguir mostrar os links já criados. Os convidados continuariam a entrar, porque o acesso usa o *hash*, mas seria preciso regenerar para voltar a copiar.

## 4. Primeiros passos no admin (`/admin`)

1. **Definições**:
   - hora;
   - nome do local e morada;
   - coordenadas: no Google Maps, carregar no ponto, copiar os números e colar;
   - capacidade (opcional);
   - dress code.
2. **Importar**:
   - colar a lista de `documentos_detalhes/ListaDeConvidados.txt`;
   - ver a pré-visualização: devem ser 62 convites e 79 pessoas;
   - confirmar.
3. Rever cada convite (lugares, telefone, grupo) e depois usar **WhatsApp** em cada um. O botão abre a conversa com a mensagem pronta e marca o convite como enviado.
4. Mais perto da data, em Definições, ligar **«Pedir a confirmação final»**. Aparece o botão **Lembrar** para quem só respondeu à etapa 1.

## 5. Verificações depois de publicar

- Abrir um convite no telemóvel (iPhone e Android) e testar a intro, o mapa e o RSVP.
- Colar um link numa conversa do WhatsApp contigo próprio e ver a pré-visualização (imagem + nome).
  - Se aparecer a antiga, o WhatsApp guarda em cache: testar com outro convite.
- No admin: o convite de teste passa a «Aberto» e as respostas aparecem.
- Depois dos testes, abrir o convite de teste (botão **Ver**) e usar **Apagar respostas**.

## Desenvolvimento local

```bash
npm install
```

```bash
npm run dev
```

- Sem variáveis do Supabase, os dados ficam em `.data/db.json`, que o Git ignora.
- `http://localhost:3000/dev/seed` importa a lista local e devolve três links de teste.
- `http://localhost:3000/dev/personagem` mostra a folha da personagem.

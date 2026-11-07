# Plano — Convite de Licenciatura da Juceline Vieira Dias

> Estado: **proposta para aprovação**. Nada será construído antes do teu "podes avançar".
> Data deste plano: 7 de Novembro de 2026.

---

## 0. O que entendi (resumo numa página)

Um convite que é **uma pequena curta-metragem interactiva**, não uma página com informações.

1. O convidado abre o link pessoal no WhatsApp.
2. A Juceline (personagem ilustrada: jovem negra, óculos, beca, mochila) atravessa o ecrã a correr, atrasada. A câmara segue-a; uma etiqueta «Juceline» com seta vai atrás dela.
3. Ao saltar, **um canudo de diploma salta da mochila**, rodopia, cai, rola e fica a abanar no meio do ecrã: «Abre, abre e vê o que tem dentro!» com uma seta desenhada à mão.
4. O convidado toca no canudo: a fita desata, o lacre parte-se, o papel **desenrola-se e passa a ser o próprio convite** — um "diploma" dirigido ao convidado pelo nome.
5. A partir daí, o convite conta a conquista com scroll: nome, curso, instituição, data, local (Google Maps / Waze / Apple Maps), dress code e confirmação de presença em duas etapas.
6. Por trás: Supabase guarda convidados e respostas; uma área de administração privada gere tudo; Vercel publica.

---

## 1. Factos verificados (e o que ainda falta confirmar)

| Dado | Estado | Fonte |
|---|---|---|
| ISAF é uma instituição de ensino superior privada **ligada à Academia BAI**, Luanda | ✅ verificado | Ver Angola (2021), O País |
| Designação legal: **Instituto Superior Técnico de Administração e Finanças** (Decreto Presidencial n.º 59/17) | ✅ verificado | lex.ao / angolex |
| Designação de uso corrente: **Instituto Superior de Administração e Finanças (ISAF)** | ✅ verificado | Times Higher Education, Expansão |
| Licenciatura em **Contabilidade e Finanças** é um dos 3 cursos do ISAF (com Gestão Bancária e Seguros; Informática e Gestão Financeira) | ✅ verificado | Decreto Executivo n.º 292/17; Ver Angola |
| Morada: Morro Bento, Av. Comandante Loy, Edifício A – Academia BAI | ✅ verificado (só referência, não vai no convite) | Times Higher Education |
| Logótipo / cores oficiais do ISAF | ❌ **não vou usar** — não posso garantir a versão oficial nem temos autorização; o convite cita a instituição em texto | — |

**Proposta de texto no convite:** «Licenciada em Contabilidade e Finanças · ISAF — Academia BAI · Luanda».
(Evito a designação legal longa porque quase ninguém a usa; diz-me se preferes outra.)

---

## 2. Direcção artística

### 2.1 Conceito: «Papel, café e ouro»
A paleta que enviaste (DressCode.jpeg) é toda em tons de café. Em vez de a tratar como "tema castanho", proponho um **mundo feito de papel recortado em camadas** — papel kraft, cartolina creme, papel de diploma — iluminado por uma luz de fim de tarde.

Porquê este estilo:
- O canudo, o diploma e o convite **são papel** → a narrativa e o visual são a mesma coisa.
- Camadas de papel dão **profundidade e parallax naturais** (cada camada move-se a uma velocidade).
- Animação "de recorte" (como marionetas de papel) permite uma personagem com **personalidade e elegância**, longe do aspecto "ilustração genérica de IA".
- Textura de papel e sombras suaves escondem a "frieza digital" e dão um ar artesanal e premium.

Uma piada visual coerente: a paleta é café → **"4 anos de cafés"** aparece como item no balancete da licenciatura (ver 4.3).

### 2.2 Paleta e papéis de cada cor

| Cor | Hex | Papel no convite |
|---|---|---|
| Espresso | `#4C2B08` | Texto principal, céu de abertura ao anoitecer, contrastes |
| Coffee | `#6D3914` | Fundos profundos, beca da personagem |
| Mocca | `#84593D` | Camadas intermédias do cenário (parallax) |
| Almond | `#B7957F` | Camadas distantes, sombras quentes |
| Caramel | `#AB7743` | Luz, realces, botões, a fita do canudo |
| Vanilla | `#D7BDA6` | O papel do convite / diploma |

Mais **dois apoios derivados** (usados com muita moderação):
- **Creme de papel** `≈ #F4E9DC` — para texto sobre fundos escuros e áreas de leitura (legibilidade).
- **Ouro-latão** `≈ #C9A35A` — só no lacre, na borla do capelo e nas partículas de brilho. É o "momento especial" da paleta.

Regra: cada cena usa **no máximo 3 cores dominantes**; o ouro aparece só em 1–2 pontos por ecrã.

### 2.3 Tipografia (a validar na pré-visualização)
- **Títulos:** Fraunces (serifa variável com eixo "Soft" e "Wonk") — elegante como um diploma, mas com curvas jovens e com personalidade. O nome "Juceline" ganha um tratamento tipográfico próprio (ligaduras/oscilação suave).
- **Texto:** Bricolage Grotesque — moderna, legível no telemóvel, com carácter.
- **Notas à mão** («Abre, abre…», setas, etiqueta "Juceline"): uma letra manuscrita sóbria, desenhada a traço com animação de escrita.
- Fontes alojadas no próprio site (sem pedidos a terceiros).

### 2.4 Ortografia
O convite será escrito na norma usada em Angola (pré-Acordo de 1990: «acto», «direcção», «objectivo»), como escreves.

---

## 3. A personagem

### 3.1 Desenho
- Jovem mulher negra, óculos redondos finos, beca castanho-café com faixa caramelo, capelo com borla dourada, mochila (com o canudo a espreitar), ténis — universitária e descontraída.
- Estilo **recorte de papel com textura**, contornos limpos, sombras suaves, expressões simples mas vivas (olhos que piscam, um sorriso, um "ups!" ao perder o canudo).
- Construída em **SVG por camadas** (cabeça, cabelo, óculos, tronco, braços, pernas, mochila, borla) para ser animada como uma marioneta: ciclo de corrida, salto, olhar para trás.

### 3.2 Limitações honestas
- Não tenho ferramenta de geração de imagens nesta sessão: a personagem é **desenhada por mim em SVG** e animada com código. Fica nítida em qualquer ecrã e leve para o telemóvel, mas o estilo será ilustrativo/estilizado, não realista.
- Para a personagem parecer **a Juceline**, preciso de saber o cabelo (tranças, afro, curto, carrapitos, comprido…) e, se possível, ver uma foto de referência (fica só no teu computador; não vai para o site nem para o GitHub).
- **Ponto de controlo obrigatório:** antes de animar seja o que for, mostro-te uma "folha de personagem" (frente, perfil a correr, expressões). Só avanço com a tua aprovação.

---

## 4. Storyboard completo

### Cena 0 — Portão (0–2 s)
Ecrã de papel creme. Uma linha manuscrita escreve-se: **«Para [nome do convidado]»**. Botão: «Toca para abrir».
- Este toque é necessário para o som funcionar no telemóvel (se aprovares som) e cria expectativa.
- Botão discreto «Saltar introdução» sempre disponível.

### Cena 1 — Abertura de câmara (2–5 s)
Câmara começa no céu ao fim da tarde (Espresso → Caramel, com sol de papel e partículas de pó dourado), **desce de cima para baixo** até à rua. Camadas de papel: imbondeiros e palmeiras recortados (Angola), silhueta urbana genérica, passeio. Nada que finja ser o edifício real do ISAF.

### Cena 2 — A corrida (5–10 s)
A Juceline entra pela esquerda, a correr, a olhar para o relógio. A **câmara segue-a na horizontal**; as camadas da frente passam rápido, as de trás devagar (parallax). Etiqueta «Juceline» com seta desenhada que a acompanha e se inclina com o movimento. A borla do capelo e a beca esvoaçam; um rasto de partículas douradas fica atrás.

### Cena 3 — O canudo salta (10–13 s)
Ela salta um degrau; o canudo **dispara da mochila**, rodopia no ar. A câmara faz **zoom e segue o canudo** (abandona a personagem, que sai pela direita sem reparar — só se ouve/vê um pequeno «ups!»).

### Cena 4 — O canudo chama (13 s → até ao toque)
O canudo cai, ressalta, rola e pára ao centro. A cada 2–3 s **chocalha** (vibração curta com leve rotação). Aparece, escrita à mão com seta: **«Abre, abre e vê o que tem dentro!»** Um brilho dourado percorre a fita.

### Cena 5 — A abertura (ao toque, ~2,5 s)
A fita **desata-se** (laço animado), o lacre dourado com monograma **«JVD»** estala, o papel **desenrola-se** a toda a largura e a câmara mergulha nele: o diploma **passa a ser o ecrã**. Transição contínua, sem corte.

### Cena 6 — O convite em scroll (scrollytelling)
Cada secção revela-se com o scroll, sem esconder informação (tudo legível mesmo sem animação):

1. **O diploma** — «Pelo presente, fica **[Nome do convidado]** oficialmente convidado/a para celebrar a licenciatura de…» → o nome **Juceline Vieira Dias** revela-se letra a letra.
2. **A conquista** — «Licenciada em **Contabilidade e Finanças**» · «ISAF — Academia BAI · Luanda». Números de contabilista a correr (tipo ecrã de bolsa) que se arrumam e formam a data.
3. **O balancete da licenciatura** *(opcional, divertido)* — uma folha de razão estilo contabilidade: Débito/Crédito com itens como «cafés», «noites de estudo», «exames»… **Resultado do exercício: Licenciada.** ⚠️ Só com números/factos que tu me deres — não invento.
4. **A data** — **28 · 11 · 2026**: folha de calendário que se arranca, contagem decrescente, botão «Adicionar ao calendário» (ficheiro .ics, sem serviços extra).
5. **Dress code** *(se a paleta for mesmo o dress code)* — as 6 cores como amostras de tecido que se abrem em leque: «Tons de café».
6. **Localização** — «Consulta a localização e escolhe a tua aplicação de mapas.» Três botões (ver §6).
7. **Confirmação de presença** — o cartão RSVP (ver §5), que muda conforme o estado do convidado.
8. **Encerramento** — a Juceline volta a aparecer, agora parada, com o canudo na mão, atira o capelo ao ar → partículas douradas. «Contamos contigo!»

### 4.1 Interactividade em todo o percurso (o convidado *faz*, não só vê)
Cada momento tem um gesto. Todos têm alternativa simples (botão) para quem não quiser ou não conseguir fazer o gesto.

| Momento | Gesto do convidado | O que acontece |
|---|---|---|
| Portão | Tocar | O nome escrito à mão "acende" e a cena abre |
| Corrida | Tocar na Juceline | Ela olha para trás, ajeita os óculos e acena — sem parar de correr |
| Corrida | Inclinar o telemóvel *(opcional)* | O cenário de papel mexe-se em profundidade (parallax por giroscópio) |
| Canudo | **Arrastar a ponta da fita** (ou tocar) | O laço desata ao ritmo do dedo; ao soltar, o lacre estala |
| Diploma | Arrastar para baixo | O papel desenrola-se seguindo o dedo, com resistência e "mola" |
| A conquista | Scroll | O nome revela-se letra a letra; os números de contabilista correm e arrumam-se na data |
| Balancete | Tocar nas linhas | Cada lançamento entra no Débito/Crédito e o saldo vai-se calculando até «Licenciada» |
| Data | **Arrancar a folha do calendário** | A folha solta-se e revela 28 · 11 · 2026 + contagem decrescente |
| Dress code | Tocar numa amostra | O leque de tecidos abre e a beca da mini-Juceline muda para essa cor |
| Localização | Tocar no mapa de papel | O mapa dobrado desdobra-se e mostra os 3 botões |
| RSVP etapa 1 | Escolher | O cartão vira (efeito 3D) para mostrar a resposta registada |
| RSVP etapa 2 | **Premir e segurar o carimbo** | Um carimbo «CONFIRMADO» é aplicado no diploma, com tinta a espalhar |
| Final | **Deslizar para cima** | A Juceline atira o capelo ao ar; explosão de partículas douradas |

### Quem volta ao link
Na 2.ª visita (para a confirmação final), a introdução **não se repete à força**: abre directamente no convite, com o cartão RSVP em destaque e opção «Ver a introdução outra vez».

### Movimento com responsabilidade
- Respeita «reduzir movimento» do telemóvel (versão com transições suaves, sem corrida nem zoom).
- Animações só em `transform`/`opacity`, 60 fps alvo em telemóveis médios; sem three.js (não é necessário e pesa no browser do WhatsApp).
- Texto sempre selecionável/legível; contraste verificado.

---

## 5. RSVP em duas etapas

### 5.1 Fluxo do convidado
| Etapa | Quando | Pergunta | Respostas |
|---|---|---|---|
| **1. Intenção** | Ao receber o convite | «Contas estar connosco?» | Sim, conto ir · Não vou conseguir · *(e quantas pessoas, se tiver lugares extra)* |
| **2. Confirmação final** | Até **15/11/2026, 23:59 (hora de Luanda)** | «Confirmas definitivamente a tua presença?» | Confirmo · Afinal não posso |

- Quem disse «Não» na etapa 1 pode mudar de ideias até ao prazo.
- Após o prazo, o cartão fica bloqueado («O prazo terminou; fala com a família») — o administrador pode reabrir individualmente.
- Campo opcional: **mensagem de parabéns para a Juceline** (o admin vê todas). *Sugestão — confirma se queres.*

### 5.2 Estados que o admin vê
`Por enviar` → `Enviado` → `Aberto` (1.ª visita registada) → `Intenção: Sim / Não` → `Final: Confirmado / Recusado / Sem resposta` · e ainda `Substituído` e `Lista de espera`.

### 5.3 ⚠️ Problema de calendário
Hoje é **7 de Novembro**; o prazo final é **15 de Novembro** — **8 dias**. Duas etapas em 8 dias é muito apertado, e o convite completo (personagem + animações) leva vários dias a construir.

Proposta (escolhe uma):
- **A) Manter 15/11** → construo **primeiro o sistema (admin + RSVP + convite elegante mas simples)** para enviares os convites em ~2–3 dias; a experiência cinematográfica entra a seguir no **mesmo link**, e os convidados vêem-na quando voltam para a confirmação final.
- **B) Adiar o prazo final** (ex.: 20/11) → envio o convite já com a experiência completa.

---

## 6. Localização e mapas

- O destino (morada, coordenadas, nome do local) fica guardado no **Supabase**, editável no admin, e **só é enviado a quem tem um link válido** — não aparece no código público nem na pré-visualização do WhatsApp.
- Botões:
  - **Google Maps** → `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG`
  - **Waze** → `https://waze.com/ul?ll=LAT,LNG&navigate=yes`
  - **Apple Maps** → `https://maps.apple.com/?daddr=LAT,LNG`
- São *links universais*: abrem a app se estiver instalada; se não estiver, abrem a versão web. As três apps **usam automaticamente a localização actual como ponto de partida** — por isso **não peço a localização ao convidado** no nosso site (menos um pedido de permissão, zero dados guardados).
- Ordem inteligente: no iPhone, Apple Maps aparece primeiro; no Android, Google Maps.
- Extra: botão «Copiar morada».

---

## 7. Segurança e privacidade

### 7.1 RSA: faz sentido? **Não.**
- RSA é criptografia assimétrica: serve para trocar chaves ou assinar mensagens entre partes que não partilham segredos. Aqui **não existe esse problema**: o servidor é o único que cria e verifica os convites.
- O tráfego já vai cifrado por **HTTPS/TLS** (a Vercel trata disso, e o TLS já usa criptografia assimétrica por baixo).
- Acrescentar RSA traria gestão de chaves, mais código e mais pontos de falha **sem proteger nada a mais**.

### 7.2 O que proponho (simples e forte)
1. **Token aleatório por convidado** — 128 bits gerados com gerador criptográfico (ex.: `/c/k7Qm2…`, 22 caracteres). Adivinhar um é impossível na prática.
2. **Na base de dados guarda-se o *hash* SHA-256 do token**, não o token em claro → se a base de dados fugisse, os links não seriam reutilizáveis.
3. Para o admin poder voltar a copiar o link, guarda-se também uma cópia **cifrada com AES-256-GCM** (chave só nas variáveis de ambiente da Vercel). Aqui sim, criptografia acrescenta valor.
4. **Revogar/regenerar link** com um clique (link reencaminhado indevidamente deixa de funcionar).
5. **Supabase com RLS activado em todas as tabelas e nenhuma permissão pública**: o browser do convidado nunca fala directamente com a base de dados; só o servidor (rotas Next.js na Vercel) o faz, com a chave de serviço que nunca sai do servidor.
6. **Cada link só vê os dados do próprio convidado** (nome, lugares, estado). Nunca a lista de convidados.
7. **Admin** com Supabase Auth (e-mail + palavra-passe forte) + tabela de administradores autorizados; páginas admin bloqueadas no servidor.
8. `noindex` em todo o site, sem analytics de terceiros, pré-visualização do WhatsApp genérica (sem nome do convidado nem morada).
9. Limite de tentativas nas rotas de RSVP e validação de todos os campos no servidor.
10. **Nenhum dado de convidados vai para o GitHub** (nem ficheiros de exemplo com nomes reais). Recomendo que o repositório seja **privado**.

---

## 8. Área de administração (`/admin`)

Desenhada para usar no telemóvel também.

- **Painel**: total de convidados, lugares confirmados (pessoas), intenções Sim/Não, confirmados finais, recusados, sem resposta, lugares livres face à capacidade.
- **Lista**: pesquisa, filtros por estado e grupo (Família, Amigos, ISAF…), colunas das duas etapas.
- **Adicionar / editar / remover** convidado: nome, nome a mostrar no convite, telefone, grupo, n.º de lugares, notas.
- **Gerar link** + **«Enviar pelo WhatsApp»**: abre o WhatsApp com a mensagem já escrita para aquele número (envias tu — sem serviços extra). Também «Copiar link».
- **Lembrete** para quem ainda não fez a confirmação final (mensagem pronta).
- **Substituições**: marcar lugar como libertado → escolher alguém da lista de espera → gerar convite novo, com ligação "substitui X".
- **Mensagens de parabéns** recebidas.
- **Importação inicial** da tua lista (`documentos_detalhes/ListaDeConvidados.txt`): 59 convites, 1 por linha. Linhas com dois nomes (casais, «X e Y», «X & Y», «e Esposa») ficam com **2 lugares**; as restantes com 1 → **76 pessoas** no total. Rever antes de gerar links (notei «(Casacos)» na linha 12 — será «Casados»?; e «Vovó e Avó Terezinha» na 32 — será «Vovô»?).
  A importação é feita por um script local que lê o ficheiro e escreve directamente no Supabase. **O ficheiro nunca entra no repositório.**
- **Definições**: data/hora, morada e coordenadas, prazo, capacidade, textos.
- **Exportar CSV**.

---

## 9. Arquitectura técnica

- **Next.js (App Router) + TypeScript**, alojado na **Vercel**.
- **Supabase**: Postgres + Auth (só para o admin). Nada mais.
- Animação: **GSAP** (ScrollTrigger, SplitText, DrawSVG, MorphSVG, Flip, CustomEase) — já instalado; canvas 2D leve para partículas.
- Imagem de partilha do WhatsApp gerada com **satori / next/og**.
- Som *(opcional)*: pequenos efeitos reais (passos, whoosh, papel, laço), sempre com botão de silêncio.

### Estrutura de pastas (prevista)
```
JuceceLineInvite/
├─ app/
│  ├─ c/[token]/        → convite individual (intro + convite + RSVP)
│  ├─ admin/            → área privada
│  └─ api/rsvp/         → rotas do servidor
├─ components/
│  ├─ intro/            → cenas, personagem, canudo
│  ├─ invite/           → secções do convite
│  └─ admin/
├─ lib/                 → supabase (servidor), tokens, cifra, validação
├─ public/              → fontes, texturas de papel, sons
├─ supabase/migrations/ → tabelas, RLS
└─ docs/                → este plano, decisões, guia de uso
```

### Modelo de dados (resumo)
- `guests` — nome, nome no convite, telefone, grupo, lugares, `token_hash`, `token_enc`, enviado/aberto (datas e n.º de visitas), etapa 1 (resposta, lugares, data), etapa 2 (resposta, data), mensagem, substitui/substituído por, lista de espera, notas.
- `event_settings` — uma linha: data/hora, local, coordenadas, prazo, capacidade.
- `rsvp_log` — histórico de cada resposta (para saber quem mudou de ideias).
- `admins` — utilizadores autorizados.

---

## 10. Fases e pontos de controlo

| Fase | Conteúdo | Ponto de controlo contigo |
|---|---|---|
| 0 | Repositório Git/GitHub, esqueleto Next.js | — |
| 1 | Supabase (tabelas + RLS), admin, RSVP, convite simples e bonito, deploy | ✅ testas o admin e um convite real |
| 2 | Folha de personagem + uma imagem estática da cena de abertura | ✅ **aprovas o estilo** |
| 3 | Sequência animada de abertura (cenas 0–5) | ✅ vês no telemóvel |
| 4 | Convite em scroll (cena 6) | ✅ revisão |
| 5 | Som (se quiseres), desempenho, testes iPhone/Android/WhatsApp, acabamentos | ✅ entrega |

Commits pequenos e descritivos a cada passo, enviados para `github.com/KazenWilver/sister-convite`.

---

## 11. Ferramentas

**Skills que vou usar (só quando chegar a cada fase):**
- `design-taste-frontend` — direcção visual anti-"cara de IA" (convite e admin).
- `svg-animations` — personagem e canudo em SVG animado.
- `emil-design-eng` — afinação das animações e micro-interacções.
- `mobile-native` — experiência no telemóvel / browser do WhatsApp.
- `earshot` (+ banco de sons) — só se aprovares som.

**Plugins:**
| Plugin | Estado | Para quê |
|---|---|---|
| `supabase` | **desligado** | Criar a base de dados, tabelas e RLS directamente daqui |
| `vercel` | **desligado** | Publicar e configurar variáveis de ambiente |
| `github` | **desligado** | Não é necessário — uso `git` directamente |

Os plugins `supabase` e `vercel` estão desligados neste projecto. Se quiseres, ligo-os no `.claude/settings.json` do projecto (só funcionam numa sessão nova). Sem eles, também consigo usar as CLIs (`npx supabase`, `npx vercel`), mas precisarás de fazer login nelas.

**Não vou usar:** three.js (desnecessário e pesado aqui), serviços externos de e-mail/SMS, analytics.

---

## 12. Perguntas para ti

1. **Prazo:** opção A (sistema primeiro, mantém 15/11) ou B (adiar o prazo final)?
2. **Cabelo da Juceline** e, se possível, uma foto de referência (fica local).
3. **Hora da festa** e **local** (podes dar depois no admin — não precisas de ma escrever aqui).
4. **Lugares:** proponho 1 lugar por nome da lista (casais = 2). Há convites com filhos ou acompanhante extra?
5. **Dress code:** a paleta é o dress code da festa? (A imagem diz "1/7" — há mais imagens?)
6. **Som:** queres efeitos sonoros (com botão de silêncio)?
7. **Extras:** mensagem de parabéns · balancete divertido (com dados teus) · contagem decrescente. Quais queres?
8. **Instituição:** «ISAF — Academia BAI» serve?
9. **Admin:** quem vai ter acesso (e-mails)?
10. **Endereço do site:** um subdomínio grátis da Vercel (ex.: `juceline.vercel.app`) serve?

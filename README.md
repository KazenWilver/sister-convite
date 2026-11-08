# Convite de Licenciatura — Juceline Vieira Dias

Convite digital interactivo com RSVP em duas etapas e área de administração.

- **Stack:** Next.js (Vercel) + Supabase
- **Plano:** [docs/PLANO.md](docs/PLANO.md)
- **Publicar (Vercel + Supabase):** [docs/DEPLOY.md](docs/DEPLOY.md)

```bash
npm install && npm run dev   # http://localhost:3000 — dados locais em .data/db.json
```

> Os dados dos convidados vivem apenas no Supabase. Nenhuma lista de convidados é guardada neste repositório.

## Abertura

- Versão escolhida: **2.5D** (cidade em camadas). As versões 2D e 3D continuam em `versions/` mas não são usadas.
- Percurso: ecrã de entrada → corrida → o canudo cai, quica e rola → o convite fechado nasce do canudo → o convidado puxa o laço → convite.
- **Quem já respondeu** (sim ou não) entra directamente no convite, sem abertura nem laço. `?intro=1` força a abertura; `?preview=1` (botão «Ver» do admin) não conta como visita.
- Com `prefers-reduced-motion`, não há corrida: o canudo aparece pousado e o convite fechado abre com um toque.

## Convite único

- Cada convite tem um **selo guilloché** desenhado a partir de uma semente própria (`UniqueSeal.tsx`): não há dois iguais.
- O admin mostra em quantos **telemóveis** o link foi aberto; acima do normal aparece «⚠ dispositivos» (link reencaminhado).
- À porta, o separador **Entrada** do admin procura o convidado pelo nome e regista a entrada; uma segunda entrada do mesmo convite dá aviso.

## Instalar no telemóvel

- No fim do convite há «Guardar o convite no telemóvel».
- Android: instala com um toque (manifesto por convidado em `/c/<token>/manifest.webmanifest` + `public/sw.js`).
- iPhone: a Apple não permite instalar sozinho; abre-se um guia de 3 passos com os ícones do Safari.

### Organização

```
components/invite/
  Experience.tsx          escolhe a versão e liga tudo
  invitation/             convite partilhado: corpo, data, convite fechado, RSVP
  shared/                 personagem, canudo, física da queda (tube.ts), formas líquidas (liquid.ts)
  versions/2d/            abertura 2D
  versions/25d/           abertura 2.5D (Intro25D.tsx; IntroScene.tsx é código antigo sem uso)
  versions/3d/            abertura 3D
```

Cada versão recebe `{ reduced, onRest }` (`versions/types.ts`) e chama `onRest` quando o canudo pára.

### Trocar o som e o modelo

- **Som do canudo:**
  - `public/sounds/tube-hit-1.mp3` é a primeira pancada;
  - `tube-hit-2.mp3` e `tube-hit-3.mp3` são os ressaltos.
  - Basta substituir os ficheiros, com menos de 1 s cada. Se faltarem, o som é sintetizado (`lib/sound.ts`).
  - Os actuais são gravações reais CC0 do Freesound, escolhidas com o earshot: «cardboard tube 01a.wav» e «cardboard tube hits.wav».
- **Outros efeitos** (também gravações reais CC0 do Freesound, em `public/sounds/`):
  - `whoosh.mp3`: ar a passar («Swipe Whoosh»);
  - `ribbon.mp3`: tecido («Fabric Flap»);
  - `unfold.mp3`: papel a desdobrar («Unfold a map»);
  - `stamp.mp3`: carimbo («Thump»);
  - `tick.mp3`: lápis a fazer um visto («pencil_check_mark_2»);
  - `toast.mp3`: brinde de copos («Glass Ding / Toast with champagne glasses»).
  - Para trocar um som, substitui o ficheiro com o mesmo nome. O volume de cada momento está em `lib/sound.ts` e nos sítios que o chamam.
- **Mapa:** OpenStreetMap através do Leaflet, tingido de azul-noite em `invitation.css` (`.vm-map`). Não precisa de chave.
- **Personagem 3D (versão 3D):**
  - coloca um glTF com animação de corrida em `public/models/juceline.glb`;
  - sem ficheiro, usa-se uma personagem low-poly feita de formas simples.

### Paleta e tipografia

- **Cores** (variáveis em `app/globals.css`): azul-noite `#050d1f` e `#0a1f44`, `#12336b`, `#1b4fa0`, azul-real `#1f5fbf`, `#4f8fe6`, `#8dbcf2`, `#d6e8fb`, `#eef5fd`, branco e preto `#08090c`.
- **Tipos de letra:**
  - Fraunces nos títulos e nomes;
  - Manrope nos detalhes;
  - Pinyon Script só no nome da Juceline.
  - Carregados com `next/font`: ficheiros servidos pelo próprio site, com `display: swap`.

### Referências de movimento

Servem só de inspiração para o ritmo, as curvas e a luz. Nenhum trabalho foi copiado.

- **Buck e Oddfellows:**
  - personagens planas com antecipação e exagero;
  - quedas com ressaltos que perdem energia.
- **ManvsMachine:**
  - tipografia que entra de várias direcções e encaixa;
  - pausas antes do «momento».
- **Gunner e Giant Ant:**
  - transições líquidas entre cenas;
  - formas que se transformam em vez de cortes secos.
- **Câmara cinematográfica** (para a 3D): órbitas lentas com aceleração e travagem suaves, e um plano final mais alto.

// A Juceline em papel recortado, construída por peças para ser animada como uma marioneta.
// Coordenadas locais: pés em y=0, virada para a direita, ~285 unidades de altura.

export const SKIN = "#7a4728";
export const SKIN_D = "#62381f";
export const HAIR = "#1d1108";
export const GOLD = "#c9a35a";
export const GOWN = "#3a2209";

export type Pose = {
  thighF: number;
  shinF: number;
  thighB: number;
  shinB: number;
  armF: number;
  armB: number;
  lean: number;
  bob: number;
  head: number;
  braids: number;
  tassel: number;
  blink: number; // 0 aberto … 1 fechado
};

export const IDLE: Pose = { thighF: 0, shinF: 0, thighB: 0, shinB: 0, armF: 4, armB: -4, lean: 0, bob: 0, head: 0, braids: 0, tassel: 0, blink: 0 };

const PIV: Record<string, [number, number]> = {
  thighF: [4, -112],
  shinF: [4, -62],
  thighB: [-6, -112],
  shinB: [-6, -62],
  armF: [8, -196],
  armB: [-10, -196],
  head: [6, -214],
  braids: [-12, -250],
  tassel: [45, -272],
};

/** Ciclo de corrida procedimental (phi em radianos). */
export function runPose(phi: number, intensity = 1): Pose {
  const leg = (psi: number) => ({ thigh: -34 * Math.sin(psi) * intensity, shin: (10 + 62 * Math.max(0, Math.cos(psi))) * intensity });
  const f = leg(phi);
  const b = leg(phi + Math.PI);
  return {
    thighF: f.thigh,
    shinF: f.shin,
    thighB: b.thigh,
    shinB: b.shin,
    armF: 40 * Math.sin(phi) * intensity,
    armB: -40 * Math.sin(phi) * intensity,
    lean: 7 * intensity,
    bob: -7 * Math.abs(Math.cos(phi)) * intensity,
    head: -3 * intensity + 2 * Math.sin(phi * 2),
    braids: (14 + 7 * Math.sin(phi * 2 - 1)) * intensity,
    tassel: (22 + 12 * Math.sin(phi * 2 - 1.5)) * intensity,
    blink: 0,
  };
}

export const JUMP: Pose = { thighF: -58, shinF: 78, thighB: 28, shinB: 70, armF: -70, armB: -40, lean: 4, bob: 0, head: -6, braids: 26, tassel: 38, blink: 0 };

export function mixPose(a: Pose, b: Pose, t: number): Pose {
  const out = {} as Pose;
  for (const k of Object.keys(a) as (keyof Pose)[]) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

export function createPuppet(root: SVGGElement) {
  const q = (n: string) => root.querySelector<SVGGElement>(`[data-p="${n}"]`);
  const parts = Object.fromEntries(Object.keys(PIV).map((k) => [k, q(k)])) as Record<string, SVGGElement | null>;
  const body = q("body");
  const eye = q("eye");
  const rot = (k: string, a: number) => parts[k]?.setAttribute("transform", `rotate(${a.toFixed(2)} ${PIV[k][0]} ${PIV[k][1]})`);
  return {
    set(p: Pose) {
      rot("thighF", p.thighF);
      rot("shinF", p.shinF);
      rot("thighB", p.thighB);
      rot("shinB", p.shinB);
      rot("armF", p.armF);
      rot("armB", p.armB);
      rot("head", p.head);
      rot("braids", p.braids);
      rot("tassel", p.tassel);
      body?.setAttribute("transform", `translate(0 ${p.bob.toFixed(2)}) rotate(${p.lean.toFixed(2)} 0 -112)`);
      const s = Math.max(0.08, 1 - p.blink);
      eye?.setAttribute("transform", `translate(0 ${(-246 * (1 - s)).toFixed(2)}) scale(1 ${s.toFixed(3)})`);
    },
  };
}

function Leg({ back }: { back?: boolean }) {
  const skin = back ? SKIN_D : SKIN;
  const shoe = back ? "#d8c4ad" : "#f4e9dc";
  const x = back ? -10 : 0;
  const k = back ? "B" : "F";
  return (
    <g data-p={`thigh${k}`}>
      <rect x={x - 3} y={-122} width={14} height={64} rx={7} fill={skin} />
      <g data-p={`shin${k}`}>
        <rect x={x - 2} y={-66} width={12} height={58} rx={6} fill={skin} />
        <rect x={x - 2.5} y={-19} width={13} height={6} rx={2} fill={shoe} />
        <path d={`M${x - 5},-14 L${x + 12},-14 Q${x + 25},-14 ${x + 28},-6 L${x + 28},0 L${x - 5},0 Z`} fill={shoe} />
        <rect x={x - 6} y={-3.5} width={35} height={4.5} rx={2} fill="#ab7743" />
        <path d={`M${x + 6},-13 l6,4 M${x + 11},-13.5 l6,4`} stroke="#ab7743" strokeWidth={1.4} strokeLinecap="round" />
      </g>
    </g>
  );
}

export function Character({ gown = GOWN, withPackScroll = true, label }: { gown?: string; withPackScroll?: boolean; label?: string }) {
  return (
    <g aria-label={label} role={label ? "img" : undefined}>
      {/* sombra no chão */}
      <ellipse cx={4} cy={2} rx={46} ry={6} fill="#2a1705" opacity={0.18} data-p="shadow" />
      <g data-p="body">
        {/* braço de trás */}
        <g data-p="armB">
          <path d="M-20,-202 Q-26,-176 -28,-150 Q-16,-143 -3,-150 Q-3,-176 0,-200 Z" fill={gown} />
          <path d="M-20,-202 Q-26,-176 -28,-150 Q-16,-143 -3,-150 Q-3,-176 0,-200 Z" fill="#000" opacity={0.28} />
          <circle cx={-15} cy={-142} r={6} fill={SKIN_D} />
        </g>
        <Leg back />
        <Leg />

        {/* canudo dentro da mochila */}
        {withPackScroll && (
          <g data-p="packScroll" transform="rotate(-30 -44 -190)">
            <rect x={-52} y={-262} width={15} height={76} rx={7.5} fill="#efe2cf" />
            <rect x={-52} y={-262} width={5} height={76} rx={2.5} fill="#fff" opacity={0.35} />
            <ellipse cx={-44.5} cy={-261} rx={7.5} ry={3} fill="#d7bda6" />
            <rect x={-52} y={-232} width={15} height={7} fill="#ab7743" />
            <rect x={-52} y={-232} width={15} height={1.4} fill={GOLD} />
          </g>
        )}

        {/* beca */}
        <path d="M-22,-200 Q-10,-210 2,-208 Q16,-210 24,-200 C31,-170 39,-118 45,-70 Q20,-60 -6,-62 Q-30,-62 -50,-70 C-42,-118 -32,-170 -22,-200 Z" fill={gown} />
        <path d="M-14,-182 Q-22,-130 -31,-68 M9,-172 Q13,-120 17,-64" stroke="#000" strokeOpacity={0.22} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <path d="M-50,-70 Q-6,-58 45,-70 L45,-66 Q-6,-54 -50,-66 Z" fill="#000" opacity={0.18} />
        {/* gola e faixa */}
        <path d="M-2,-209 L6,-195 L14,-209 Z" fill="#f4e9dc" />
        <path d="M-5,-207 Q-7,-160 -9,-112 L0,-112 Q2,-160 4,-205 Z" fill="#97652f" />
        <path d="M10,-207 Q17,-160 23,-106 L34,-108 Q28,-160 20,-205 Z" fill="#ab7743" />
        <path d="M10,-207 Q17,-160 23,-106" stroke={GOLD} strokeWidth={1.2} fill="none" />

        {/* mochila */}
        <path d="M-50,-198 Q-61,-196 -61,-180 L-59,-128 Q-58,-115 -44,-115 L-24,-117 Q-15,-119 -16,-134 L-19,-190 Q-21,-200 -32,-200 Z" fill="#84593d" />
        <path d="M-53,-196 Q-40,-207 -21,-196 L-20,-168 Q-38,-159 -57,-170 Z" fill="#6d3914" />
        <rect x={-42} y={-172} width={9} height={7} rx={1.5} fill={GOLD} />
        <path d="M-55,-150 Q-38,-145 -20,-150" stroke="#f4e9dc" strokeOpacity={0.5} strokeWidth={1.1} strokeDasharray="2.5 3" fill="none" />
        <path d="M-20,-197 Q-2,-208 12,-198 L10,-191 Q-1,-199 -19,-189 Z" fill="#4f3220" />

        {/* pescoço */}
        <rect x={-1} y={-222} width={13} height={18} rx={4} fill={SKIN_D} />

        {/* cabeça */}
        <g data-p="head">
          <g data-p="braids">
            {[
              "M-4,-252 Q-14,-214 -14,-168",
              "M-10,-254 Q-22,-216 -24,-164",
              "M-16,-252 Q-29,-214 -33,-170",
              "M-21,-246 Q-35,-208 -42,-178",
              "M-25,-238 Q-41,-206 -48,-188",
              "M-1,-246 Q-6,-210 -4,-178",
            ].map((d, i) => (
              <g key={i}>
                <path d={d} stroke={HAIR} strokeWidth={6.6} strokeLinecap="round" fill="none" />
                <path d={d} stroke="#4a2e18" strokeWidth={1.4} strokeDasharray="2.5 3.5" strokeLinecap="round" fill="none" />
              </g>
            ))}
            {[
              [-14, -168],
              [-24, -164],
              [-33, -170],
              [-42, -178],
              [-48, -188],
              [-4, -178],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={2.8} fill={GOLD} />
            ))}
          </g>
          <ellipse cx={-2} cy={-250} rx={25} ry={24} fill={HAIR} />
          <path d="M-8,-262 Q10,-275 24,-261 Q30,-253 30,-247 L34.5,-240 Q35,-236 29.5,-235 Q29.5,-226 24,-222 Q14,-213 2,-218 Q-10,-224 -12,-240 Q-13,-254 -8,-262 Z" fill={SKIN} />
          <path d="M-26,-246 Q-27,-274 2,-279 Q26,-279 30,-256 Q18,-265 4,-262 Q-8,-258 -12,-244 Q-18,-237 -26,-246 Z" fill={HAIR} />
          <ellipse cx={-8} cy={-240} rx={4.6} ry={6.2} fill={SKIN_D} />
          <circle cx={-8} cy={-231.5} r={2.3} fill={GOLD} />
          <circle cx={14} cy={-235} r={4.6} fill="#b0603e" opacity={0.3} />
          <g data-p="eye">
            <ellipse cx={20} cy={-246} rx={3.9} ry={2.9} fill="#fbf3e8" />
            <circle cx={21.2} cy={-246} r={2.1} fill={HAIR} />
            <circle cx={21.8} cy={-246.9} r={0.65} fill="#fff" />
          </g>
          <path d="M15.5,-249 Q20,-251.6 24.5,-249" stroke={HAIR} strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <path d="M14,-255.5 Q19.5,-258.5 26,-255.5" stroke={HAIR} strokeWidth={2.1} fill="none" strokeLinecap="round" />
          <path d="M30.5,-243 Q32.5,-239 29.5,-237" stroke={SKIN_D} strokeWidth={1.3} fill="none" strokeLinecap="round" />
          <path d="M22.5,-229 Q26.5,-226.2 29.5,-229.4" stroke="#4a2416" strokeWidth={1.9} fill="none" strokeLinecap="round" />
          {/* óculos */}
          <circle cx={20.5} cy={-246} r={7.6} fill="#fff" fillOpacity={0.13} stroke={GOLD} strokeWidth={1.9} />
          <path d="M12.9,-247 L-5,-244.5 M28.1,-247 L31.5,-248" stroke={GOLD} strokeWidth={1.6} strokeLinecap="round" />
          <path d="M16,-250.5 L18.4,-252.6" stroke="#fff" strokeOpacity={0.75} strokeWidth={1.2} strokeLinecap="round" />
          {/* capelo */}
          <g data-p="cap">
            <path d="M-20,-262 Q2,-283 28,-262 L27,-256.5 Q2,-273 -19,-256.5 Z" fill={HAIR} />
            <path d="M-36,-272 L6,-261 L46,-273 L46,-268.5 L6,-256.5 L-36,-267.5 Z" fill="#2e1b0b" />
            <path d="M-36,-272 L4,-285.5 L46,-273 L6,-261 Z" fill={HAIR} />
            <path d="M-36,-272 L4,-285.5 L46,-273" stroke="#5a3a1c" strokeWidth={1.5} fill="none" strokeLinejoin="round" />
            <path d="M5,-273 Q26,-272.5 45,-272" stroke={GOLD} strokeWidth={1.7} fill="none" />
            <circle cx={5} cy={-273} r={2.6} fill={GOLD} />
            <g data-p="tassel">
              <path d="M45,-272 L45,-252" stroke={GOLD} strokeWidth={1.7} />
              <rect x={41} y={-254} width={8} height={4.5} rx={1.6} fill="#a5823f" />
              <path d="M41.5,-250 L48.5,-250 L50.5,-231 L39.5,-231 Z" fill={GOLD} />
              <path d="M42.5,-248 L41.8,-232 M45,-248 L45,-232 M47.5,-248 L48.2,-232" stroke="#a5823f" strokeWidth={0.8} />
            </g>
          </g>
        </g>

        {/* braço da frente */}
        <g data-p="armF">
          <path d="M-3,-202 Q-7,-176 -7,-150 Q6,-142 21,-150 Q19,-178 19,-200 Z" fill={gown} />
          <path d="M-7,-151 Q6,-143 21,-151 L21,-146.5 Q6,-138.5 -7,-146.5 Z" fill="#ab7743" />
          <circle cx={7} cy={-140} r={6.6} fill={SKIN} />
        </g>
      </g>
    </g>
  );
}

/** Mini-Juceline num <svg> próprio (secções do convite). */
export function CharacterSvg({ className, gown, id }: { className?: string; gown?: string; id?: string }) {
  return (
    <svg className={className} viewBox="-75 -300 150 312" aria-hidden="true" id={id}>
      <g data-root>
        <Character gown={gown} withPackScroll={false} />
      </g>
    </svg>
  );
}

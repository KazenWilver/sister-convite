// Contrato comum das três aberturas (2D, 2.5D, 3D).
// Cada versão mostra a corrida e a queda do canudo e chama onRest quando o canudo pára,
// com a posição do canudo no ecrã (px) — é daí que nasce o convite fechado.
export type IntroProps = {
  reduced: boolean;
  onRest: (origin: { x: number; y: number }) => void;
};

export type Version = "2d" | "25d" | "3d";
export const VERSIONS: { id: Version; label: string; ready: boolean }[] = [
  { id: "2d", label: "2D", ready: true },
  { id: "25d", label: "2.5D", ready: true },
  { id: "3d", label: "3D", ready: true },
];

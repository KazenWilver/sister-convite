import { Seal } from "@/components/Seal";

// A página inicial não revela nada sobre a festa: o convite só existe no link pessoal.
export default function Home() {
  return (
    <main className="plain paper-grain">
      <div>
        <Seal className="seal" />
        <h1>Este convite é pessoal</h1>
        <p>Abre o link que recebeste para veres o teu convite.</p>
      </div>
    </main>
  );
}

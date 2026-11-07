import { notFound } from "next/navigation";
import { CharacterSheet } from "./sheet";

// Folha de personagem — só existe em desenvolvimento.
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <CharacterSheet />;
}

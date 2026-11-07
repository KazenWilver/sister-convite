import { EVENT } from "@/lib/config";
import { findGuestByToken } from "@/lib/guests";
import { store } from "@/lib/store";

// Ficheiro .ics para adicionar a festa ao calendário do telemóvel (iPhone/Android/Outlook).
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const g = await findGuestByToken(token);
  if (!g || g.status !== "active") return new Response("Not found", { status: 404 });
  const s = await store.getSettings();
  const esc = (v: string) => v.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  const m = s.eventTime?.match(/(\d{1,2})\s*[h:.]\s*(\d{2})?/i);
  const day = EVENT.dateISO.replace(/-/g, "");
  let when: string[];
  if (m) {
    const start = new Date(`${EVENT.dateISO}T${m[1].padStart(2, "0")}:${(m[2] ?? "00").padStart(2, "0")}:00+01:00`);
    const end = new Date(start.getTime() + 5 * 36e5);
    const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    when = [`DTSTART:${f(start)}`, `DTEND:${f(end)}`];
  } else {
    when = [`DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:20261129`];
  }
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Convite Juceline//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:licenciatura-juceline-${day}@convite`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    ...when,
    `SUMMARY:${esc(`Festa de licenciatura da ${EVENT.firstName}`)}`,
    `DESCRIPTION:${esc(`Celebração da licenciatura de ${EVENT.graduate} em ${EVENT.course}.`)}`,
    ...(s.address ? [`LOCATION:${esc(s.address)}`] : []),
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Amanhã é a festa da Juceline!",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="festa-juceline.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}

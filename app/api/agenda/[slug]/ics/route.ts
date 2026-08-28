import { NextResponse } from "next/server";
import { getAgendaItemBySlug } from "@/lib/content";

function icsDate(value: string) { return new Date(value).toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z"); }
function escapeIcs(value: string) { return value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n"); }

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const item = getAgendaItemBySlug((await params).slug);
  if (!item) return NextResponse.json({ message: "Evento não encontrado" }, { status: 404 });
  const start = icsDate(item.date);
  const end = icsDate(item.endDate ?? new Date(new Date(item.date).getTime() + 60 * 60 * 1000).toISOString());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sindicomar//Agenda//PT-BR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:${item.id}@sindicomar.com.br`, `DTSTAMP:${icsDate(new Date().toISOString())}`, `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${escapeIcs(item.title)}`, `DESCRIPTION:${escapeIcs(item.description)}`, `LOCATION:${escapeIcs(item.municipality)}`, "END:VEVENT", "END:VCALENDAR"];
  return new NextResponse(lines.join("\r\n"), { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="${item.slug}.ics"` } });
}

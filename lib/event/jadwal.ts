// lib/event/jadwal.ts — jadwal pertandingan disimpan sebagai waktu setempat WIB: "YYYY-MM-DD" atau "YYYY-MM-DDTHH:mm".
const HOUR = 3600e3, DAY = 24 * HOUR, WIB = 7 * HOUR;

export type Jadwal = { start: number; allDay: boolean }; // start = epoch ms

export function parseJadwal(j?: string): Jadwal | null {
  const m = j ? /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(j) : null;
  if (!m) return null;
  const allDay = m[4] === undefined;
  return { start: Date.UTC(+m[1], +m[2] - 1, +m[3], allDay ? 0 : +m[4], allDay ? 0 : +m[5]) - WIB, allDay };
}

const wibDay = (ms: number) => Math.floor((ms + WIB) / DAY);

// Pengingat: mulai kurang dari `days` hari lagi (atau baru berlangsung ≤ 3 jam lalu; acara sehari penuh tampil sepanjang harinya).
export function inWindow(p: Jadwal, now: number, days = 7): boolean {
  const horizon = now + days * DAY;
  return p.allDay ? p.start + DAY > now && p.start < horizon : p.start > now - 3 * HOUR && p.start < horizon;
}

export type Level = 'now' | 'today' | 'soon' | 'week';
export function countdown(p: Jadwal, now: number): { label: string; level: Level } {
  const d = wibDay(p.start) - wibDay(now);
  if (p.allDay) {
    if (d <= 0) return { label: 'HARI INI', level: 'today' };
    return d === 1 ? { label: 'BESOK', level: 'soon' } : { label: `${d} HARI LAGI`, level: d <= 2 ? 'soon' : 'week' };
  }
  const diff = p.start - now;
  if (diff <= 0) return { label: 'BERLANGSUNG', level: 'now' };
  if (diff < HOUR) return { label: `${Math.ceil(diff / 60e3)} MENIT LAGI`, level: 'today' };
  if (d <= 0) return { label: `${Math.floor(diff / HOUR)} JAM LAGI`, level: 'today' };
  return d === 1 ? { label: 'BESOK', level: 'soon' } : { label: `${d} HARI LAGI`, level: d <= 2 ? 'soon' : 'week' };
}

// File kalender (.ics) satu acara, waktu Asia/Jakarta.
export function buildIcs(o: { id: string; judul: string; jadwal: string; lokasi?: string; deskripsi?: string }): string | null {
  const p = parseJadwal(o.jadwal);
  if (!p) return null;
  const [d, t] = o.jadwal.split('T');
  const ymd = d.replace(/-/g, '');
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
  let when: string[];
  if (p.allDay) {
    const next = new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10) + 1)).toISOString().slice(0, 10).replace(/-/g, '');
    when = [`DTSTART;VALUE=DATE:${ymd}`, `DTEND;VALUE=DATE:${next}`];
  } else {
    const [h, mi] = t.split(':').map(Number);
    const end = new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), h, mi + 90));
    const e = end.toISOString().replace(/[-:]/g, '').slice(0, 15);
    when = [`DTSTART;TZID=Asia/Jakarta:${ymd}T${h.toString().padStart(2, '0')}${mi.toString().padStart(2, '0')}00`, `DTEND;TZID=Asia/Jakarta:${e}`];
  }
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RW 012//Agenda 17an//ID', 'BEGIN:VEVENT',
    `UID:${o.id}@rw012`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    ...when, `SUMMARY:${esc(o.judul)}`,
    ...(o.lokasi ? [`LOCATION:${esc(o.lokasi)}`] : []), ...(o.deskripsi ? [`DESCRIPTION:${esc(o.deskripsi)}`] : []),
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Pertandingan segera dimulai', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

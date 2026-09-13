import type { Warga } from './types';

export type AgeCategory = 'Balita' | 'Anak' | 'Remaja' | 'Dewasa' | 'Lansia';

export function getAge(tanggalLahir: string | undefined, today = new Date()): number | null {
  if (!tanggalLahir) return null;
  const birthDate = new Date(`${tanggalLahir}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;

  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayPassed = today.getMonth() > birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!birthdayPassed) age -= 1;
  return age >= 0 ? age : null;
}

export function getAgeCategory(age: number | null): AgeCategory | null {
  if (age === null) return null;
  if (age <= 5) return 'Balita';
  if (age <= 12) return 'Anak';
  if (age <= 17) return 'Remaja';
  if (age <= 59) return 'Dewasa';
  return 'Lansia';
}

export function getWargaAgeCategory(warga: Pick<Warga, 'tanggal_lahir'>): AgeCategory | null {
  return getAgeCategory(getAge(warga.tanggal_lahir));
}

export interface BirthdayNotice {
  warga: Warga;
  daysUntil: number;
}

export function getUpcomingBirthdays(wargaList: Warga[], today = new Date()): BirthdayNotice[] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return wargaList
    .map((warga) => {
      if (!warga.tanggal_lahir) return null;
      const birthDate = new Date(`${warga.tanggal_lahir}T00:00:00`);
      if (Number.isNaN(birthDate.getTime())) return null;

      const birthday = new Date(start.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      if (birthday < start) birthday.setFullYear(start.getFullYear() + 1);
      if (birthday > end) return null;

      return {
        warga,
        daysUntil: Math.round((birthday.getTime() - start.getTime()) / 86400000),
      };
    })
    .filter((notice): notice is BirthdayNotice => notice !== null)
    .sort((first, second) => first.daysUntil - second.daysUntil);
}

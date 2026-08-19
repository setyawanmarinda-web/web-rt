// lib/dataMode.ts
// Helper untuk cek mode data aplikasi: 'dev' (dummy/localStorage) atau 'live' (MongoDB)

export const DATA_MODE = (process.env.NEXT_PUBLIC_DATA_MODE ?? 'dev') as 'dev' | 'live';

export const isLiveMode = (): boolean => DATA_MODE === 'live';
export const isDevMode = (): boolean => DATA_MODE === 'dev';

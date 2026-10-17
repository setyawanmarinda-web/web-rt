import { useSyncExternalStore } from 'react';

let editing = false;
let resetVersion = 0;
let startedAt = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export const layoutEdit = {
  setEditing(value: boolean) {
    if (editing === value) return;
    editing = value;
    if (value) startedAt = Date.now();
    emit();
  },
  resetAll() {
    resetVersion += 1;
    emit();
  },
  getStartedAt() {
    return startedAt;
  },
};

export function useEditing(): boolean {
  return useSyncExternalStore(subscribe, () => editing, () => false);
}

export function useResetVersion(): number {
  return useSyncExternalStore(subscribe, () => resetVersion, () => 0);
}

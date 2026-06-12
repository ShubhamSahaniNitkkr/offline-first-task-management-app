/** Simulated offline flag — toggled by the dev/demo offline button. */
let manualOffline = false;

export function setManualOfflineGate(enabled: boolean) {
  manualOffline = enabled;
}

export function isManualOffline(): boolean {
  return manualOffline;
}

/** True only when the browser is online and manual offline is off. */
export function isEffectivelyOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine && !manualOffline;
}

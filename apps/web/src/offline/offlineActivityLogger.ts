import { store } from '../store/index.js';
import { logOfflineActivity, type OfflineActivityStatus } from '../store/slices/syncSlice.js';

export function logOfflineStep(
  step: string,
  detail: string,
  status: OfflineActivityStatus = 'completed',
) {
  store.dispatch(logOfflineActivity({ step, detail, status }));
}

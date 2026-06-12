import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export type OfflineActivityStatus = 'running' | 'completed' | 'waiting' | 'skipped' | 'error';

export interface OfflineActivity {
  id: string;
  timestamp: number;
  step: string;
  detail: string;
  status: OfflineActivityStatus;
}

interface SyncState {
  isOnline: boolean;
  manualOffline: boolean;
  isSyncing: boolean;
  queueCount: number;
  lastSyncAt: string | null;
  conflicts: string[];
  activities: OfflineActivity[];
  /** Stays true after Go offline — panel only collapses, never hides. */
  offlinePipelineVisible: boolean;
  offlinePipelineMinimized: boolean;
}

const initialState: SyncState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  manualOffline: false,
  isSyncing: false,
  queueCount: 0,
  lastSyncAt: null,
  conflicts: [],
  activities: [],
  offlinePipelineVisible: false,
  offlinePipelineMinimized: false,
};

const MAX_ACTIVITIES = 30;

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnline(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
    setManualOffline(state, action: PayloadAction<boolean>) {
      state.manualOffline = action.payload;
    },
    setSyncing(state, action: PayloadAction<boolean>) {
      state.isSyncing = action.payload;
    },
    setQueueCount(state, action: PayloadAction<number>) {
      state.queueCount = action.payload;
    },
    setLastSyncAt(state, action: PayloadAction<string | null>) {
      state.lastSyncAt = action.payload;
    },
    addConflict(state, action: PayloadAction<string>) {
      if (!state.conflicts.includes(action.payload)) {
        state.conflicts.push(action.payload);
      }
    },
    removeConflict(state, action: PayloadAction<string>) {
      state.conflicts = state.conflicts.filter((c) => c !== action.payload);
    },
    logOfflineActivity(
      state,
      action: PayloadAction<{ step: string; detail: string; status: OfflineActivityStatus }>,
    ) {
      const entry: OfflineActivity = {
        id: uuidv4(),
        timestamp: Date.now(),
        ...action.payload,
      };
      state.activities = [entry, ...state.activities].slice(0, MAX_ACTIVITIES);
    },
    clearOfflineActivities(state) {
      state.activities = [];
    },
    showOfflinePipeline(state) {
      state.offlinePipelineVisible = true;
      state.offlinePipelineMinimized = false;
    },
    setOfflinePipelineMinimized(state, action: PayloadAction<boolean>) {
      state.offlinePipelineMinimized = action.payload;
    },
  },
});

export const {
  setOnline,
  setManualOffline,
  setSyncing,
  setQueueCount,
  setLastSyncAt,
  addConflict,
  removeConflict,
  logOfflineActivity,
  clearOfflineActivities,
  showOfflinePipeline,
  setOfflinePipelineMinimized,
} = syncSlice.actions;
export default syncSlice.reducer;

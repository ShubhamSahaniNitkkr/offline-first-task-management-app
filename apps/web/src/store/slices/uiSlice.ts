import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  activeView: 'shop' | 'cart' | 'wishlist' | 'orders' | 'settings';
  filterPanelOpen: boolean;
}

const initialState: UiState = {
  sidebarOpen: true,
  activeView: 'shop',
  filterPanelOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setActiveView(state, action: PayloadAction<UiState['activeView']>) {
      state.activeView = action.payload;
    },
    toggleFilterPanel(state) {
      state.filterPanelOpen = !state.filterPanelOpen;
    },
  },
});

export const { toggleSidebar, setActiveView, toggleFilterPanel } = uiSlice.actions;
export default uiSlice.reducer;

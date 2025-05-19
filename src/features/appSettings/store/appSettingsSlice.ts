import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppSettingsState {
  theme: 'light' | 'dark' | 'system';
  mcpServerUrl: string | null;
  language: string;
}

const initialState: AppSettingsState = {
  theme: 'system',
  mcpServerUrl: null,
  language: 'zh-CN',
};

const appSettingsSlice = createSlice({
  name: 'appSettings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setMcpServerUrl: (state, action: PayloadAction<string | null>) => {
      state.mcpServerUrl = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
  },
});

export const { setTheme, setMcpServerUrl, setLanguage } = appSettingsSlice.actions;

export default appSettingsSlice.reducer;

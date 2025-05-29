import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ModelProfile } from '../../../config/modelProfiles';

export interface ModelProfileState {
  profiles: Record<string, ModelProfile>;
  currentProfileId: string;
  currentSystemMessage?: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: ModelProfileState = {
  profiles: {},
  currentProfileId: 'qwen3-0.6b',
  currentSystemMessage: undefined,
  isLoading: false,
  error: null,
};

const modelProfileSlice = createSlice({
  name: 'modelProfiles',
  initialState,
  reducers: {
    setProfiles: (state, action: PayloadAction<Record<string, ModelProfile>>) => {
      state.profiles = action.payload;
    },
    addProfile: (state, action: PayloadAction<ModelProfile>) => {
      state.profiles[action.payload.id] = action.payload;
    },
    updateProfile: (state, action: PayloadAction<ModelProfile>) => {
      state.profiles[action.payload.id] = action.payload;
    },
    removeProfile: (state, action: PayloadAction<string>) => {
      delete state.profiles[action.payload];
    },
    setCurrentProfileId: (state, action: PayloadAction<string>) => {
      state.currentProfileId = action.payload;
      // 重置自定义系统消息
      state.currentSystemMessage = undefined;
    },
    setCurrentSystemMessage: (state, action: PayloadAction<string | undefined>) => {
      state.currentSystemMessage = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setProfiles,
  addProfile,
  updateProfile,
  removeProfile,
  setCurrentProfileId,
  setCurrentSystemMessage,
  setLoading,
  setError,
} = modelProfileSlice.actions;

export default modelProfileSlice.reducer;

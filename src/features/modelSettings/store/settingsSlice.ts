import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  DEFAULT_MODEL_PARAMS_NON_THINKING,
  DEFAULT_MODEL_PARAMS_THINKING,
  DEFAULT_QWEN_MODEL_FILENAME
} from '../../../config/modelConfig';

export interface ModelParams {
  temperature: number;
  top_p: number;
  top_k: number;
  min_p: number;
  presence_penalty: number;
  max_tokens: number;
  stop: string[];
}

export interface SettingsState {
  currentModelId: string;
  paramsThinking: ModelParams;
  paramsNonThinking: ModelParams;
}

const initialState: SettingsState = {
  currentModelId: DEFAULT_QWEN_MODEL_FILENAME,
  paramsThinking: DEFAULT_MODEL_PARAMS_THINKING,
  paramsNonThinking: DEFAULT_MODEL_PARAMS_NON_THINKING,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setCurrentModelId: (state, action: PayloadAction<string>) => {
      state.currentModelId = action.payload;
    },
    updateThinkingParam: (
      state,
      action: PayloadAction<{
        paramName: keyof ModelParams;
        value: any;
      }>
    ) => {
      const { paramName, value } = action.payload;
      (state.paramsThinking as any)[paramName] = value;
    },
    updateNonThinkingParam: (
      state,
      action: PayloadAction<{
        paramName: keyof ModelParams;
        value: any;
      }>
    ) => {
      const { paramName, value } = action.payload;
      (state.paramsNonThinking as any)[paramName] = value;
    },
    resetThinkingParamsToDefault: (state) => {
      state.paramsThinking = DEFAULT_MODEL_PARAMS_THINKING;
    },
    resetNonThinkingParamsToDefault: (state) => {
      state.paramsNonThinking = DEFAULT_MODEL_PARAMS_NON_THINKING;
    },
  },
});

export const {
  setCurrentModelId,
  updateThinkingParam,
  updateNonThinkingParam,
  resetThinkingParamsToDefault,
  resetNonThinkingParamsToDefault,
} = settingsSlice.actions;

export default settingsSlice.reducer;

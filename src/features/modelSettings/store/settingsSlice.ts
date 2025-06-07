import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ModelParams,
  ModelProfile,
  DEFAULT_PROFILES,
  PREDEFINED_MODELS,
  DEFAULT_QWEN_PROFILE,
} from "../../../config/modelProfiles";

// ModelParams interface is already defined locally, ensure it's consistent
// export interface ModelParams { ... }

export interface SettingsState {
  currentModelId: string; // This will now be a PredefinedModel.id, e.g., 'qwen3-0.6b-q8'
  paramsThinking: ModelParams;
  paramsNonThinking: ModelParams;
}

// Find the first predefined Qwen model to use as a default, or fallback to a hardcoded ID if none are Qwen-related.
const initialDefaultPredefinedModel =
  PREDEFINED_MODELS.find((m) => m.profile_id === DEFAULT_QWEN_PROFILE.id) ||
  PREDEFINED_MODELS[0];
const initialDefaultProfile =
  DEFAULT_PROFILES[initialDefaultPredefinedModel.profile_id] ||
  DEFAULT_QWEN_PROFILE;

const initialState: SettingsState = {
  currentModelId: initialDefaultPredefinedModel.id, // e.g., 'qwen3-0.6b-q8'
  paramsThinking: initialDefaultProfile.params_thinking,
  paramsNonThinking: initialDefaultProfile.params_non_thinking,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setCurrentModelId: (state, action: PayloadAction<string>) => {
      const newModelId = action.payload;
      const predefinedModel = PREDEFINED_MODELS.find(
        (m) => m.id === newModelId
      );
      if (predefinedModel) {
        const profile = DEFAULT_PROFILES[predefinedModel.profile_id];
        if (profile) {
          state.currentModelId = newModelId;
          state.paramsThinking = profile.params_thinking;
          state.paramsNonThinking = profile.params_non_thinking;
        } else {
          console.warn(
            `Profile not found for model ID: ${newModelId}. Settings not changed.`
          );
        }
      } else {
        console.warn(
          `Predefined model not found for ID: ${newModelId}. Settings not changed.`
        );
      }
    },
    updateThinkingParam: (
      state,
      action: PayloadAction<{
        paramName: keyof ModelParams;
        value: any; // Consider more specific types if possible
      }>
    ) => {
      const { paramName, value } = action.payload;
      // Ensure paramsThinking is treated as ModelParams
      (state.paramsThinking as Record<keyof ModelParams, any>)[paramName] =
        value;
    },
    updateNonThinkingParam: (
      state,
      action: PayloadAction<{
        paramName: keyof ModelParams;
        value: any; // Consider more specific types if possible
      }>
    ) => {
      const { paramName, value } = action.payload;
      // Ensure paramsNonThinking is treated as ModelParams
      (state.paramsNonThinking as Record<keyof ModelParams, any>)[paramName] =
        value;
    },
    resetThinkingParamsToDefault: (state) => {
      const predefinedModel = PREDEFINED_MODELS.find(
        (m) => m.id === state.currentModelId
      );
      if (predefinedModel) {
        const profile = DEFAULT_PROFILES[predefinedModel.profile_id];
        if (profile) {
          state.paramsThinking = profile.params_thinking;
        } else {
          // Fallback to initial default if current profile somehow missing
          state.paramsThinking = initialDefaultProfile.params_thinking;
        }
      } else {
        state.paramsThinking = initialDefaultProfile.params_thinking;
      }
    },
    resetNonThinkingParamsToDefault: (state) => {
      const predefinedModel = PREDEFINED_MODELS.find(
        (m) => m.id === state.currentModelId
      );
      if (predefinedModel) {
        const profile = DEFAULT_PROFILES[predefinedModel.profile_id];
        if (profile) {
          state.paramsNonThinking = profile.params_non_thinking;
        } else {
          state.paramsNonThinking = initialDefaultProfile.params_non_thinking;
        }
      } else {
        state.paramsNonThinking = initialDefaultProfile.params_non_thinking;
      }
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

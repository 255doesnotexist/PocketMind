import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LocalModelInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  lastModified: number;
  description?: string;
  isSelected?: boolean;
}

export interface DownloadProgress {
  bytesWritten: number;
  contentLength: number;
  percentage: number;
}

export interface ModelManagementState {
  localModels: LocalModelInfo[];
  isDownloading: boolean;
  downloadProgress: DownloadProgress | null;
  downloadUrl: string;
  downloadFilename: string;
  error: string | null;
}

const initialState: ModelManagementState = {
  localModels: [],
  isDownloading: false,
  downloadProgress: null,
  downloadUrl: '',
  downloadFilename: '',
  error: null,
};

const modelManagementSlice = createSlice({
  name: 'modelManagement',
  initialState,
  reducers: {
    setLocalModels: (state, action: PayloadAction<LocalModelInfo[]>) => {
      state.localModels = action.payload;
    },
    addLocalModel: (state, action: PayloadAction<LocalModelInfo>) => {
      state.localModels.push(action.payload);
    },
    removeLocalModel: (state, action: PayloadAction<string>) => {
      state.localModels = state.localModels.filter(
        (model) => model.id !== action.payload
      );
    },
    setDownloadState: (state, action: PayloadAction<boolean>) => {
      state.isDownloading = action.payload;
      if (!action.payload) {
        state.downloadProgress = null;
      }
    },
    updateDownloadProgress: (state, action: PayloadAction<DownloadProgress>) => {
      state.downloadProgress = action.payload;
    },
    setDownloadUrl: (state, action: PayloadAction<string>) => {
      state.downloadUrl = action.payload;
    },
    setDownloadFilename: (state, action: PayloadAction<string>) => {
      state.downloadFilename = action.payload;
    },
    selectModel: (state, action: PayloadAction<string>) => {
      state.localModels = state.localModels.map(model => ({
        ...model,
        isSelected: model.id === action.payload
      }));
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setLocalModels,
  addLocalModel,
  removeLocalModel,
  setDownloadState,
  updateDownloadProgress,
  setDownloadUrl,
  setDownloadFilename,
  selectModel,
  setError,
} = modelManagementSlice.actions;

export default modelManagementSlice.reducer;

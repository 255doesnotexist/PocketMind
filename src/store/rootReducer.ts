import { combineReducers } from '@reduxjs/toolkit';
import chatReducer from '@features/chat/store/chatSlice';
import settingsReducer from '@features/modelSettings/store/settingsSlice';
import modelManagementReducer from '@features/modelManagement/store/modelManagementSlice';
import appSettingsReducer from '@features/appSettings/store/appSettingsSlice';

const rootReducer = combineReducers({
  chat: chatReducer,
  settings: settingsReducer,
  modelManagement: modelManagementReducer,
  appSettings: appSettingsReducer,
});

export default rootReducer;

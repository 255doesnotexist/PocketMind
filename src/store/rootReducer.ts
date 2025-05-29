import { combineReducers } from '@reduxjs/toolkit';
import chatReducer from '@features/chat/store/chatSlice';
import settingsReducer from '@features/modelSettings/store/settingsSlice';
import modelManagementReducer from '@features/modelManagement/store/modelManagementSlice';
import appSettingsReducer from '@features/appSettings/store/appSettingsSlice';
import modelProfileReducer from '@features/modelProfiles/store/modelProfileSlice';

const rootReducer = combineReducers({
  chat: chatReducer,
  settings: settingsReducer,
  modelManagement: modelManagementReducer,
  appSettings: appSettingsReducer,
  modelProfiles: modelProfileReducer,
});

export default rootReducer;

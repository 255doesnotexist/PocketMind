import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { store } from './store';
import AppNavigator from './navigation/AppNavigator';
import { darkTheme, lightTheme } from './theme/paperTheme';
import { useSelector } from 'react-redux';
import { RootState } from './store';

// 主题包装组件，用于在Redux和PaperProvider之间传递主题
const ThemedApp = () => {
  const { theme: appTheme } = useSelector((state: RootState) => state.appSettings);
  const deviceTheme = useColorScheme();
  
  // 确定当前主题
  const themePreference = appTheme === 'system' ? deviceTheme : appTheme;
  const theme = themePreference === 'dark' ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <StatusBar 
        barStyle={themePreference === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <AppNavigator />
    </PaperProvider>
  );
};

// 应用根组件
const App = () => {
  return (
    <ReduxProvider store={store}>
      <ThemedApp />
    </ReduxProvider>
  );
};

export default App;

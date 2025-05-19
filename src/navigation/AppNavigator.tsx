import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import { RootStackParamList } from './types';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { navigationDarkTheme, navigationLightTheme } from '../theme/paperTheme';
import { useColorScheme } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { theme: appTheme } = useSelector((state: RootState) => state.appSettings);
  const deviceTheme = useColorScheme();
  
  // 确定当前主题
  const themePreference = appTheme === 'system' ? deviceTheme : appTheme;
  const theme = themePreference === 'dark' ? navigationDarkTheme : navigationLightTheme;

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Main" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

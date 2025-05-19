import { MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';

// 定义主题颜色
const lightColors = {
  ...MD3LightTheme.colors,
  primary: '#006e5f',
  secondary: '#385a53',
  tertiary: '#4a6358',
  background: '#fbfdf9',
  surface: '#fbfdf9',
};

const darkColors = {
  ...MD3DarkTheme.colors,
  primary: '#50dcbd',
  secondary: '#b9cfca',
  tertiary: '#b1cdbe',
  background: '#191c1a',
  surface: '#191c1a',
};

// 创建纸质主题
export const lightTheme = {
  ...MD3LightTheme,
  colors: lightColors,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: darkColors,
};

// 适配导航主题
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

// 导航主题
export const navigationLightTheme = {
  ...LightTheme,
  colors: {
    ...LightTheme.colors,
    ...lightColors,
  },
};

export const navigationDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    ...darkColors,
  },
};

export type AppTheme = typeof lightTheme;

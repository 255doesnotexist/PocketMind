import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './src/App';

// 确保同时注册到 Expo 和 React Native 系统
registerRootComponent(App);
AppRegistry.registerComponent('main', () => App);

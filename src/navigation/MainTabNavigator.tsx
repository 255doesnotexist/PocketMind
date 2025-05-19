import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import ChatScreen from '../features/chat/screens/ChatScreen';
import ModelSettingsScreen from '../features/modelSettings/screens/ModelSettingsScreen';
import ModelManagementScreen from '../features/modelManagement/screens/ModelManagementScreen';
import AppSettingsScreen from '../features/appSettings/screens/AppSettingsScreen';

// Import types
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: '聊天',
          tabBarIcon: ({ color, size }) => (
            <Icon name="message-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ModelSettings"
        component={ModelSettingsScreen}
        options={{
          tabBarLabel: '模型设置',
          tabBarIcon: ({ color, size }) => (
            <Icon name="tune" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ModelManagement"
        component={ModelManagementScreen}
        options={{
          tabBarLabel: '模型管理',
          tabBarIcon: ({ color, size }) => (
            <Icon name="brain" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AppSettings"
        component={AppSettingsScreen}
        options={{
          tabBarLabel: '设置',
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;

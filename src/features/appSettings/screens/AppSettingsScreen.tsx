import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, Divider, List, Portal, RadioButton, Text, TextInput, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { setMcpServerUrl, setTheme } from '../store/appSettingsSlice';
import RNFS from 'react-native-fs';
import LocalModelStorageService from '../../modelManagement/services/LocalModelStorageService';

const AppSettingsScreen = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { theme: appTheme, mcpServerUrl } = useSelector(
    (state: RootState) => state.appSettings
  );

  const [localMcpServerUrl, setLocalMcpServerUrl] = useState<string>(mcpServerUrl || '');
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  // 切换主题
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    dispatch(setTheme(newTheme));
    setShowThemeDialog(false);
  };

  // 更新MCP服务器URL
  const handleUpdateMcpUrl = () => {
    dispatch(setMcpServerUrl(localMcpServerUrl || null));
  };

  // 清除缓存
  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      // 获取模型目录
      const modelsDir = await LocalModelStorageService.getModelsDir();
      
      // 清除模型目录下所有临时文件
      const files = await RNFS.readDir(modelsDir);
      for (const file of files) {
        if (file.name.endsWith('.temp') || file.name.endsWith('.downloading')) {
          await RNFS.unlink(file.path);
        }
      }
      
      // 清除应用缓存目录
      const cacheDirs = [
        RNFS.CachesDirectoryPath,
        RNFS.TemporaryDirectoryPath
      ];
      
      for (const dir of cacheDirs) {
        try {
          const cacheFiles = await RNFS.readDir(dir);
          for (const file of cacheFiles) {
            if (!file.isDirectory()) {
              await RNFS.unlink(file.path);
            }
          }
        } catch (error) {
          console.log(`Skip cleaning ${dir}:`, error);
        }
      }
      
      setShowClearCacheDialog(false);
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setClearingCache(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Title title="外观" />
        <Card.Content>
          <List.Item
            title="主题"
            description={
              appTheme === 'light'
                ? '浅色'
                : appTheme === 'dark'
                ? '深色'
                : '跟随系统'
            }
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setShowThemeDialog(true)}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="MCP服务器设置" />
        <Card.Content>
          <TextInput
            label="服务器URL"
            value={localMcpServerUrl}
            onChangeText={setLocalMcpServerUrl}
            placeholder="例如: https://your-mcp-server.com/api"
            style={styles.textInput}
          />
          <Text style={styles.helperText}>
            {mcpServerUrl
              ? `当前已连接: ${mcpServerUrl}`
              : '未连接到MCP服务器（纯本地推理模式）'}
          </Text>
          <Button
            mode="contained"
            onPress={handleUpdateMcpUrl}
            style={styles.button}
          >
            更新服务器设置
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="存储" />
        <Card.Content>
          <Button
            mode="outlined"
            icon="delete"
            onPress={() => setShowClearCacheDialog(true)}
            style={styles.button}
          >
            清除应用缓存
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="关于" />
        <Card.Content>
          <View style={styles.aboutContent}>
            <Text style={styles.appName}>PocketMind</Text>
            <Text style={styles.version}>版本 1.0.0</Text>
            <Divider style={styles.divider} />
            <Text style={styles.description}>
              PocketMind是一款强大的Android本地AI推理工具，专注于离线运行小型语言模型，同时提供良好的用户体验。
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* 主题选择对话框 */}
      <Portal>
        <Dialog
          visible={showThemeDialog}
          onDismiss={() => setShowThemeDialog(false)}
        >
          <Dialog.Title>选择主题</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value) => handleThemeChange(value as 'light' | 'dark' | 'system')}
              value={appTheme}
            >
              <RadioButton.Item label="浅色" value="light" />
              <RadioButton.Item label="深色" value="dark" />
              <RadioButton.Item label="跟随系统" value="system" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowThemeDialog(false)}>取消</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 清除缓存确认对话框 */}
      <Portal>
        <Dialog
          visible={showClearCacheDialog}
          onDismiss={() => !clearingCache && setShowClearCacheDialog(false)}
        >
          <Dialog.Title>清除缓存</Dialog.Title>
          <Dialog.Content>
            <Text>
              确定要清除应用缓存吗？这将删除临时文件和下载历史，但不会删除已下载的模型。
            </Text>
            {clearingCache && (
              <Text style={{ marginTop: 12, color: theme.colors.primary }}>
                正在清除缓存...
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setShowClearCacheDialog(false)}
              disabled={clearingCache}
            >
              取消
            </Button>
            <Button 
              onPress={handleClearCache}
              disabled={clearingCache}
            >
              确认
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  textInput: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
  helperText: {
    fontSize: 12,
    opacity: 0.7,
  },
  aboutContent: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  version: {
    fontSize: 16,
    marginBottom: 16,
  },
  divider: {
    width: '100%',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AppSettingsScreen;

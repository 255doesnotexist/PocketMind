import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, TextInput, useTheme } from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { THINKING_COMMAND, NO_THINKING_COMMAND } from '../../../config/modelConfig';
import RecordButton from '../../speechToText/components/RecordButton';

interface ChatInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  onSendImage?: (base64: string) => void;
  whisperModelPath?: string | null;
}

const ChatInputBar: React.FC<ChatInputBarProps> = ({
  value,
  onChangeText,
  onSend,
  disabled = false,
  isGenerating = false,
  onSendImage,
  whisperModelPath = null,
}) => {
  const theme = useTheme();
  const [isPickingImage, setIsPickingImage] = useState(false);

  // 处理图像选择
  const handleImagePick = async () => {
    if (disabled || isPickingImage) return;

    setIsPickingImage(true);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 1024,
        maxWidth: 1024,
      });

      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        
        // 读取图像文件为Base64
        const base64 = await RNFS.readFile(uri, 'base64');
        
        // 如果提供了图像处理回调，则调用它
        if (onSendImage) {
          onSendImage(base64);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
    } finally {
      setIsPickingImage(false);
    }
  };

  // 添加/think指令
  const addThinkCommand = () => {
    onChangeText(`${THINKING_COMMAND} ${value}`);
  };

  // 添加/no_think指令
  const addNoThinkCommand = () => {
    onChangeText(`${NO_THINKING_COMMAND} ${value}`);
  };

  return (
    <View style={styles.container}>
      {!isGenerating && (
        <View style={styles.commandButtons}>
          <IconButton
            icon="brain"
            size={20}
            iconColor={theme.colors.primary}
            onPress={addThinkCommand}
            disabled={disabled}
          />
          <IconButton
            icon="brain-off"
            size={20}
            iconColor={theme.colors.primary}
            onPress={addNoThinkCommand}
            disabled={disabled}
          />
        </View>
      )}
      
      <TextInput
        style={styles.input}
        value={value}
        mode="outlined"
        placeholder={
          isGenerating 
            ? "正在生成回复..." 
            : disabled 
              ? "加载模型中..." 
              : "输入消息..."
        }
        onChangeText={onChangeText}
        disabled={disabled || isGenerating}
        multiline
        dense
        right={
          onSendImage && (
            <TextInput.Icon
              icon="image"
              onPress={handleImagePick}
              disabled={disabled || isGenerating || isPickingImage}
            />
          )
        }
      />

      {/* 语音输入按钮 */}
      {whisperModelPath && (
        <RecordButton
          whisperModelPath={whisperModelPath}
          onTranscriptReady={(text) => onChangeText(text)}
          disabled={disabled || isGenerating}
          size={40}
        />
      )}

      <IconButton
        icon={isGenerating ? "stop" : "send"}
        size={24}
        iconColor={theme.colors.primary}
        style={styles.sendButton}
        onPress={onSend}
        disabled={(value.trim() === '' && !isGenerating) || disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 4,
  },
  commandButtons: {
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    maxHeight: 120,
  },
  sendButton: {
    marginHorizontal: 4,
  },
});

export default ChatInputBar;

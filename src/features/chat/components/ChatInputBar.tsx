import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, TextInput, useTheme } from "react-native-paper";
import { launchImageLibrary } from "react-native-image-picker";
import * as RNFS from "@dr.pogodin/react-native-fs";
import RecordButton from "../../speechToText/components/RecordButton";

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
  // This local state is for the icon toggle.
  // The actual thinking mode for sending is handled by ChatScreen using Redux state and ChatHelper.
  const [thinkingModeActive, setThinkingModeActive] = useState(true);

  // 处理图像选择
  const handleImagePick = async () => {
    if (disabled || isPickingImage) return;

    setIsPickingImage(true);
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        includeBase64: false,
        maxHeight: 1024,
        maxWidth: 1024,
      });

      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        const uri = result.assets[0].uri;

        // 读取图像文件为Base64
        const base64 = await RNFS.readFile(uri, "base64");

        // 如果提供了图像处理回调，则调用它
        if (onSendImage) {
          onSendImage(base64);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSend = () => {
    if (isGenerating) {
      // Stop action
      onSend();
      return;
    }
    // No longer prepending commands here.
    // ChatScreen will handle command extraction and formatting using ChatHelper.
    onSend(); // Call the original send handler with the raw input value
  };

  return (
    <View style={styles.container}>
      {/* Thinking Mode Toggle Button */}
      {!isGenerating && (
        <IconButton
          icon={thinkingModeActive ? "brain" : "brain-off"}
          size={20}
          iconColor={theme.colors.primary}
          onPress={() => setThinkingModeActive(!thinkingModeActive)}
          disabled={disabled}
          style={{ marginRight: 8 }} // Added for spacing between toggle button and input
        />
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
        onPress={handleSend} // Use the new handleSend function
        disabled={(value.trim() === "" && !isGenerating) || disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    marginBottom: 4,
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

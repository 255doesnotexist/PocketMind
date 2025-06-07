import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../store";
import {
  addMessage,
  Message,
  setGenerating,
  setThinkingContent,
  toggleThinkingMode,
  updateLastMessageChunk,
} from "../store/chatSlice";
import ChatInputBar from "../components/ChatInputBar";
import MessageBubble from "../components/MessageBubble";
import LlamaService from "../services/LlamaService";
import {
  extractCommandFromInput, // Updated import
  formatPromptForModel, // Updated import
  parseQwenThinkingTags,
} from "../utils/ChatHelper";
import LocalModelStorageService from "../../modelManagement/services/LocalModelStorageService";
import ModelProfileServiceInstance from "../../../services/ModelProfileService"; // Added for fetching profile

const ChatScreen = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { messages, isThinkingModeActive, isGenerating } = useSelector(
    (state: RootState) => state.chat
  );
  const { currentModelId } = useSelector((state: RootState) => state.settings);
  const [inputText, setInputText] = useState("");
  const [modelLoaded, setModelLoaded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // 加载模型
  useEffect(() => {
    const loadModel = async () => {
      try {
        // 确保模型目录存在
        await LocalModelStorageService.ensureModelDirectory();

        // 获取模型名称
        const modelName = currentModelId;
        // 获取模型路径
        const modelPath = LocalModelStorageService.getModelFileUri(modelName);

        // 检查模型文件是否存在
        const fileExists =
          await LocalModelStorageService.modelExists(modelName);
        if (!fileExists) {
          console.error(`Model file not found at path: ${modelPath}`);
          // 可以选择抛出错误或者设置一个状态来通知用户
          // throw new Error(`Model file not found: ${modelName}`);
          setModelLoaded(false); // 明确设置模型未加载
          return; // 提前返回，不尝试初始化
        }

        // 初始化Llama服务
        const success = await LlamaService.initLlama(modelPath);
        if (success) {
          console.log("Model loaded successfully");
          setModelLoaded(true);
        } else {
          console.error("Failed to load model");
        }
      } catch (error) {
        console.error("Error loading model:", error);
      }
    };

    loadModel();

    // 组件卸载时释放模型
    return () => {
      LlamaService.releaseLlama();
    };
  }, [currentModelId]);

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputText.trim() || !modelLoaded || isGenerating) return;

    const currentProfile =
      await ModelProfileServiceInstance.getCurrentProfile();
    if (!currentProfile) {
      console.error("Current model profile not found. Cannot send message.");
      return;
    }

    // 检查是否有思考指令
    const {
      command: extractedCommand,
      content: contentWithoutCommand,
      isThinking: thinkingStateFromCommand,
    } = extractCommandFromInput(inputText, currentProfile);

    // 如果是思考指令，则切换思考模式
    if (currentProfile.supports_thinking && extractedCommand !== null) {
      // thinkingStateFromCommand will be true for thinking_command, false for no_thinking_command
      // We dispatch toggleThinkingMode based on the actual command's intent.
      if (thinkingStateFromCommand !== null) {
        dispatch(toggleThinkingMode(thinkingStateFromCommand));
      }
    }

    // 清空输入框
    const userInput = inputText;
    setInputText("");

    // 获取实际要发送的内容
    // contentWithoutCommand is the user's text after stripping any detected command.
    const messageContent = contentWithoutCommand;

    // 如果仅仅是切换思考模式的指令，且没有实际内容，则不发送消息
    if (extractedCommand !== null && !messageContent.trim()) return;

    // 创建用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: Date.now(),
    };

    // 添加到消息列表
    dispatch(addMessage(userMessage));

    // 开始生成回复
    dispatch(setGenerating(true));

    // 创建助手消息占位
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: Date.now() + 1,
      pending: true,
    };
    dispatch(addMessage(assistantMessage));

    try {
      // 格式化提示词
      // The active thinking mode for the new message is determined by isThinkingModeActive from Redux state,
      // unless a command in the input overrode it (which is handled by extractCommandFromInput and then by formatPromptForModel internally)
      const prompt = await formatPromptForModel(
        messageContent, // This is already stripped of any command by extractCommandFromInput
        messages, // Current history
        isThinkingModeActive, // UI state for thinking mode
        undefined, // No custom system message here, profile default will be used
        currentModelId // Pass current model ID to use its profile
      );

      // 生成文本
      await LlamaService.generateCompletion(
        prompt,
        undefined,
        isThinkingModeActive,
        (token) => {
          // 更新最后一条消息
          dispatch(updateLastMessageChunk(token));

          // 解析思考内容
          const { thinkingContent } = parseQwenThinkingTags(token);
          if (thinkingContent) {
            dispatch(setThinkingContent(thinkingContent));
          }
        }
      );
    } catch (error) {
      console.error("Error generating completion:", error);
      dispatch(updateLastMessageChunk(" [生成失败]"));
    } finally {
      dispatch(setGenerating(false));
    }
  };

  console.log(messages);
  console.log("Model loaded:", modelLoaded);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={{ paddingBottom: 16 }}
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map((item) => (
          <MessageBubble
            key={item.id}
            message={item}
            isThinkingMode={isThinkingModeActive}
          />
        ))}
      </ScrollView>

      <ChatInputBar
        value={inputText}
        onChangeText={setInputText}
        onSend={handleSendMessage}
        disabled={!modelLoaded || isGenerating}
        isGenerating={isGenerating}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
});

export default ChatScreen;

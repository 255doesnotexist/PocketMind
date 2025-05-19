import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { addMessage, Message, setGenerating, setThinkingContent, toggleThinkingMode, updateLastMessageChunk } from '../store/chatSlice';
import ChatInputBar from '../components/ChatInputBar';
import MessageBubble from '../components/MessageBubble';
import LlamaService from '../services/LlamaService';
import { checkThinkingCommand, formatPromptForQwen, parseQwenThinkingTags } from '../utils/ChatHelper';
import { DEFAULT_QWEN_MODEL_FILENAME } from '../../../config/modelConfig';
import LocalModelStorageService from '../../modelManagement/services/LocalModelStorageService';

const ChatScreen = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { messages, isThinkingModeActive, isGenerating } = useSelector(
    (state: RootState) => state.chat
  );
  const { currentModelId } = useSelector((state: RootState) => state.settings);
  const [inputText, setInputText] = useState('');
  const [modelLoaded, setModelLoaded] = useState(false);

  // 加载模型
  useEffect(() => {
    const loadModel = async () => {
      try {
        // 确保模型目录存在
        await LocalModelStorageService.ensureModelDirectory();

        // 获取模型名称
        const modelName = currentModelId || DEFAULT_QWEN_MODEL_FILENAME;
        // 获取模型路径
        const modelPath = LocalModelStorageService.getModelFileUri(
          modelName
        );

        // 检查模型文件是否存在
        const fileExists = await LocalModelStorageService.modelExists(modelName);
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
          console.log('Model loaded successfully');
          setModelLoaded(true);
        } else {
          console.error('Failed to load model');
        }
      } catch (error) {
        console.error('Error loading model:', error);
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

    // 检查是否有思考指令
    const { isThinkingCommand, restContent, shouldActivateThinking } = checkThinkingCommand(inputText);

    // 如果是思考指令，则切换思考模式
    if (shouldActivateThinking !== null) {
      dispatch(toggleThinkingMode(shouldActivateThinking));
    }

    // 清空输入框
    const userInput = inputText;
    setInputText('');

    // 获取实际要发送的内容
    const messageContent = isThinkingCommand ? restContent : userInput;

    // 如果仅仅是切换思考模式的指令，则不发送消息
    if (isThinkingCommand && !messageContent.trim()) return;

    // 创建用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
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
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      pending: true,
    };
    dispatch(addMessage(assistantMessage));

    try {
      // 格式化提示词
      const prompt = formatPromptForQwen(
        messageContent,
        messages,
        isThinkingModeActive,
        isThinkingCommand
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
      console.error('Error generating completion:', error);
      dispatch(updateLastMessageChunk(' [生成失败]'));
    } finally {
      dispatch(setGenerating(false));
    }
  };

  console.log(messages);
  console.log('Model loaded:', modelLoaded);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isThinkingMode={isThinkingModeActive}
          />
        )}
      /> */}
      
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
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
});

export default ChatScreen;

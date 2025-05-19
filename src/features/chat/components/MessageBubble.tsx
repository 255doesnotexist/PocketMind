import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Card, IconButton, useTheme } from 'react-native-paper';
import { parseQwenThinkingTags } from '../utils/ChatHelper';
import { Message } from '../store/chatSlice';
import { Image } from 'react-native';

interface MessageBubbleProps {
  message: Message;
  isThinkingMode: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isThinkingMode 
}) => {
  const theme = useTheme();
  const [showThinking, setShowThinking] = useState(false);
  const isUser = message.role === 'user';
  
  // 解析消息内容
  const { visibleContent, thinkingContent } = parseQwenThinkingTags(message.content);
  const hasThinking = !!thinkingContent;

  // 根据角色设置颜色和样式
  const bubbleStyle = {
    backgroundColor: isUser ? theme.colors.primaryContainer : theme.colors.secondaryContainer,
    alignSelf: isUser ? 'flex-end' as const : 'flex-start' as const,
  };
  
  const textColor = {
    color: isUser ? theme.colors.onPrimaryContainer : theme.colors.onSecondaryContainer,
  };

  // 显示思考内容
  const renderThinking = () => {
    if (!hasThinking || !showThinking) return null;
    
    return (
      <Card style={styles.thinkingContainer}>
        <Card.Title title="思考过程" />
        <Card.Content>
          <Text style={styles.thinkingText}>{thinkingContent}</Text>
        </Card.Content>
      </Card>
    );
  };

  // 渲染图像
  const renderImage = () => {
    if (!message.imageBase64) return null;
    
    return (
      <Image
        source={{ uri: `data:image/jpeg;base64,${message.imageBase64}` }}
        style={styles.image}
        resizeMode="contain"
      />
    );
  };

  return (
    <View style={[
      styles.container, 
      isUser ? styles.userContainer : styles.assistantContainer
    ]}>
      {/* 消息气泡 */}
      <View style={[styles.bubble, bubbleStyle]}>
        {renderImage()}
        
        <Text style={[styles.messageText, textColor]}>
          {visibleContent || (message.pending ? "思考中..." : "")}
        </Text>
        
        {/* 思考模式指示器 */}
        {hasThinking && (
          <IconButton
            icon={showThinking ? "chevron-up" : "chevron-down"}
            size={20}
            onPress={() => setShowThinking(!showThinking)}
            iconColor={textColor.color}
            style={styles.thinkingButton}
          />
        )}
      </View>
      
      {/* 思考内容 */}
      {renderThinking()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    marginRight: 8,
  },
  assistantContainer: {
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  bubble: {
    borderRadius: 18,
    padding: 12,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  thinkingButton: {
    alignSelf: 'center',
    margin: 0,
    marginTop: 4,
  },
  thinkingContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  thinkingText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 8,
    borderRadius: 8,
  },
});

export default MessageBubble;

import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ActivityIndicator, IconButton, Text, useTheme } from 'react-native-paper';
import { useWhisper } from '../hooks/useWhisper';

interface RecordButtonProps {
  whisperModelPath: string | null;
  onTranscriptReady: (text: string) => void;
  disabled?: boolean;
  size?: number;
}

const RecordButton: React.FC<RecordButtonProps> = ({
  whisperModelPath,
  onTranscriptReady,
  disabled = false,
  size = 48,
}) => {
  const theme = useTheme();
  const {
    isLoading,
    isRecording,
    isTranscribing,
    error,
    startRecording,
    stopRecording,
  } = useWhisper(whisperModelPath, onTranscriptReady);

  const [showError, setShowError] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 脉动动画
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isRecording, pulseAnim]);

  // 错误处理
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 处理按钮点击
  const handlePress = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  // 渲染按钮
  const renderButton = () => {
    if (isLoading) {
      return (
        <ActivityIndicator 
          size={size * 0.6} 
          color={theme.colors.primary} 
        />
      );
    }
    
    if (isTranscribing) {
      return (
        <IconButton
          icon="text-recognition"
          size={size * 0.6}
          iconColor={theme.colors.primary}
          disabled
        />
      );
    }
    
    const iconName = isRecording ? 'stop' : 'microphone';
    const buttonColor = isRecording ? theme.colors.error : theme.colors.primary;
    
    return (
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <IconButton
          icon={iconName}
          size={size * 0.6}
          iconColor="white"
          style={[
            styles.recordButton,
            { backgroundColor: buttonColor, width: size, height: size, borderRadius: size / 2 }
          ]}
          onPress={handlePress}
          disabled={disabled || (!isRecording && !whisperModelPath)}
        />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {renderButton()}
      
      {showError && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    margin: 0,
  },
  errorContainer: {
    position: 'absolute',
    bottom: -24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
    borderRadius: 4,
  },
  errorText: {
    fontSize: 12,
  },
});

export default RecordButton;

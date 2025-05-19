import { useState, useCallback } from 'react';
import { PermissionStatus } from 'expo-modules-core';
import WhisperService from '../services/WhisperService';

interface UseWhisperResult {
  isLoading: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  transcript: string | null;
  error: string | null;
  permissions: PermissionStatus | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
}

/**
 * 语音识别Hook
 * @param whisperModelPath Whisper模型路径
 * @param onTranscriptReady 转写完成回调
 * @returns 语音识别状态和控制方法
 */
export const useWhisper = (
  whisperModelPath: string | null,
  onTranscriptReady?: (text: string) => void
): UseWhisperResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionStatus | null>(null);

  // 开始录音
  const startRecording = useCallback(async () => {
    if (!whisperModelPath) {
      setError('未配置语音识别模型');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // 初始化Whisper
      const initSuccess = await WhisperService.initWhisper(whisperModelPath);
      if (!initSuccess) {
        setError('语音识别模型初始化失败');
        setIsLoading(false);
        return;
      }

      // 获取录音权限
      const permissionStatus = await WhisperService.requestPermissions();
      setPermissions(permissionStatus);

      if (permissionStatus !== PermissionStatus.GRANTED) {
        setError('需要录音权限');
        setIsLoading(false);
        return;
      }

      // 开始录音
      const recordSuccess = await WhisperService.startRecording();
      if (!recordSuccess) {
        setError('开始录音失败');
        setIsLoading(false);
        return;
      }

      setIsRecording(true);
    } catch (err) {
      console.error('开始录音错误:', err);
      setError('录音时出现错误');
    } finally {
      setIsLoading(false);
    }
  }, [whisperModelPath]);

  // 停止录音并转写
  const stopRecording = useCallback(async () => {
    if (!isRecording) return;

    setIsTranscribing(true);
    try {
      // 停止录音
      const audioUri = await WhisperService.stopRecording();
      setIsRecording(false);

      if (!audioUri) {
        setError('录音保存失败');
        setIsTranscribing(false);
        return;
      }

      // 转写音频
      const text = await WhisperService.transcribe();
      setIsTranscribing(false);

      if (!text) {
        setError('语音识别失败');
        return;
      }

      // 设置转写结果
      setTranscript(text);
      
      // 调用回调
      if (onTranscriptReady) {
        onTranscriptReady(text);
      }
    } catch (err) {
      console.error('停止录音错误:', err);
      setError('转写时出现错误');
      setIsTranscribing(false);
    }
  }, [isRecording, onTranscriptReady]);

  return {
    isLoading,
    isRecording,
    isTranscribing,
    transcript,
    error,
    permissions,
    startRecording,
    stopRecording,
  };
};

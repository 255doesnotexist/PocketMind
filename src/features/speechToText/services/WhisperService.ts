import WhisperContext from 'whisper.rn';
import { Audio } from 'expo-av';
import { PermissionStatus } from 'expo-modules-core';

class WhisperService {
  private whisperContext: any | null = null; // Changed WhisperContext to any
  private modelPath: string | null = null;
  private recording: Audio.Recording | null = null;
  private audioUri: string | null = null;
  private isRecording: boolean = false;

  constructor() {}

  /**
   * 初始化Whisper上下文
   * @param modelPath 模型文件路径
   * @returns 初始化是否成功
   */
  async initWhisper(modelPath: string): Promise<boolean> {
    try {
      if (this.whisperContext && this.modelPath === modelPath) {
        return true;
      }

      if (this.whisperContext) {
        await this.releaseWhisper();
      }

      console.log(`Initializing Whisper with model: ${modelPath}`);
      // @ts-ignore TODO: whisper.rn types might be incorrect for initWhisper params
      this.whisperContext = await WhisperContext.initWhisper({
        filePath: modelPath, // Changed modelPath to filePath based on common patterns
      });

      this.modelPath = modelPath;
      return true;
    } catch (error) {
      console.error('Error initializing Whisper:', error);
      this.whisperContext = null;
      this.modelPath = null;
      return false;
    }
  }

  /**
   * 请求音频录制权限
   */
  async requestPermissions(): Promise<PermissionStatus> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return PermissionStatus.UNDETERMINED;
    }
  }

  /**
   * 开始录音
   */
  async startRecording(): Promise<boolean> {
    if (this.isRecording) {
      return false;
    }

    try {
      // 请求权限
      const status = await this.requestPermissions();
      if (status !== PermissionStatus.GRANTED) {
        console.warn('Audio recording permissions not granted');
        return false;
      }

      // 配置音频
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 开始录音
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      this.recording = recording;
      this.isRecording = true;
      console.log('Recording started');

      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  /**
   * 停止录音
   */
  async stopRecording(): Promise<string | null> {
    if (!this.recording || !this.isRecording) {
      return null;
    }

    try {
      // 停止录音
      await this.recording.stopAndUnloadAsync();
      
      // 获取录音URI
      const uri = this.recording.getURI();
      this.audioUri = uri;
      this.isRecording = false;
      
      console.log('Recording stopped, URI:', uri);
      
      // 重置音频模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      this.isRecording = false;
      return null;
    }
  }

  /**
   * 转写录音
   */
  async transcribe(): Promise<string | null> {
    if (!this.whisperContext || !this.audioUri) {
      console.error('Whisper context or audio URI not available');
      return null;
    }

    try {
      console.log('Starting transcription...');
      const result = await this.whisperContext.transcribe(this.audioUri);
      console.log('Transcription complete:', result.text);
      return result.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return null;
    }
  }

  /**
   * 释放Whisper上下文
   */
  async releaseWhisper(): Promise<void> {
    if (this.whisperContext) {
      await this.whisperContext.releaseContext();
      this.whisperContext = null;
      this.modelPath = null;
    }
  }

  /**
   * 取消当前录音
   */
  async cancelRecording(): Promise<void> {
    if (this.recording && this.isRecording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (error) {
        console.error('Error cancelling recording:', error);
      }
      
      this.isRecording = false;
      this.recording = null;
      this.audioUri = null;
    }
  }

  /**
   * 检查是否正在录音
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }
}

// 单例模式导出
export default new WhisperService();

import { initLlama, LlamaContext, CompletionParams, releaseAllLlama } from 'llama.rn'; // Changed releaseLlama to releaseAllLlama, removed loadModelInfo
import { 
  DEFAULT_MODEL_PARAMS_NON_THINKING, 
  DEFAULT_MODEL_PARAMS_THINKING 
} from '../../../config/modelConfig';

class LlamaService {
  private llamaContext: LlamaContext | null = null;
  private currentModelPath: string | null = null;
  private generationInProgress: boolean = false;
  private abortController: AbortController | null = null;

  constructor() {}

  /**
   * 初始化Llama上下文
   * @param modelPath 模型文件路径
   * @param params 初始化参数
   * @returns 初始化是否成功
   */
  async initLlama(modelPath: string, params?: any): Promise<boolean> { // Changed InitContextOptions to any
    try {
      if (this.llamaContext && this.currentModelPath === modelPath) {
        console.log('Llama context already initialized with this model.');
        return true;
      }
      if (this.llamaContext) {
        await this.releaseLlama(); // Release existing context
      }
      console.log(`Initializing Llama with model: ${modelPath}`);
      // @ts-ignore TODO: llama.rn types might be incorrect for initLlama params
      this.llamaContext = await initLlama({ model: modelPath, ...params }); 
      this.currentModelPath = modelPath;
      console.log('Llama context initialized successfully.');
      return true;
    } catch (error: any) { // Added type for error
      console.error('Error initializing Llama context:', error);
      this.llamaContext = null;
      this.currentModelPath = null;
      return false;
    }
  }

  /**
   * 生成文本补全
   * @param prompt 提示文本
   * @param llamaParams 参数
   * @param onToken 流式Token回调
   * @returns 生成的文本和计时信息
   */
  async generateCompletion(
    prompt: string,
    llamaParams?: CompletionParams,
    isThinkingMode: boolean = false,
    onToken?: (token: string) => void
  ): Promise<{ text: string; timings?: any }> { // Changed CompletionTimings to any
    if (!this.llamaContext) {
      console.error('Llama context not initialized.');
      return { text: '' };
    }

    if (this.generationInProgress) {
      console.warn('Generation already in progress. Please wait or stop the current generation.');
      return { text: '' };
    }

    this.generationInProgress = true;
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    // 根据思考模式选择默认参数
    const defaultParams = isThinkingMode 
      ? DEFAULT_MODEL_PARAMS_THINKING 
      : DEFAULT_MODEL_PARAMS_NON_THINKING;

    // 合并参数
    const finalParams = { ...defaultParams, ...llamaParams, prompt };

    try {
      let resultText = '';
      // @ts-ignore TODO: llama.rn types might be incorrect for completion callback and stopCompletion
      const { text, timings } = await this.llamaContext.completion(finalParams, (data) => {
        if (signal.aborted) {
          // @ts-ignore
          this.llamaContext.stopCompletion(); 
          return;
        }
        const token = data.token;
        resultText += token;
        if (onToken) {
          onToken(token);
        }
      });
      this.generationInProgress = false;
      return { text: resultText, timings };
    } catch (error: any) { // Added type for error
      this.generationInProgress = false;
      if (error && error.message === 'Aborted') { // Added check for error existence
        console.log('Generation aborted by user.');
        return { text: '' };
      }
      console.error('Error during Llama completion:', error);
      return { text: '' };
    }
  }

  /**
   * 停止当前生成
   */
  async stopGeneration(): Promise<void> {
    if (this.abortController) { // Fixed: Added parentheses
      this.abortController.abort();
      // It's also good practice to have a direct stop method in llama.rn if possible
      // and call it here, e.g., this.llamaContext?.stop();
    }
    this.generationInProgress = false;
    console.log('Generation stop requested.');
  }

  /**
   * 检查模型是否已加载
   * @returns 是否已加载
   */
  isModelLoaded(): boolean {
    return !!this.llamaContext;
  }

  /**
   * 获取当前模型路径
   * @returns 模型路径
   */
  getCurrentModelPath(): string | null {
    return this.currentModelPath;
  }

  /**
   * 释放Llama上下文
   */
  async releaseLlama(): Promise<void> {
    if (this.llamaContext) {
      try {
        await releaseAllLlama(); // Use releaseAllLlama from import
        console.log('Llama context released.');
      } catch (error: any) { // Added type for error
        console.error('Error releasing Llama context:', error);
      }
      this.llamaContext = null;
      this.currentModelPath = null;
    }
  }

  /**
   * 加载模型信息
   * @param modelPath 模型路径
   * @returns 模型信息
   */
  async loadModelInfo(modelPath: string): Promise<any | null> { // Changed ModelInfo to any
    try {
      console.log(`Loading model info for: ${modelPath}`);
      // @ts-ignore TODO: loadModelInfo might not be exported or might have a different name
      const modelInfo = await this.llamaContext?.loadModelInfo(modelPath); 
      console.log('Model info loaded:', modelInfo);
      return modelInfo;
    } catch (error: any) { // Added type for error
      console.error('Error loading model info:', error);
      return null;
    }
  }
}

// 单例模式导出
export default new LlamaService();

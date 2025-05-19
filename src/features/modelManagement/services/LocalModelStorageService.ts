import * as RNFS from '@dr.pogodin/react-native-fs';

interface LocalModelInfo {
  id: string; // Add id property
  name: string;
  path: string;
  size: number;
  lastModified: number; // Changed from Date to number
  // Add other relevant properties if needed
}

class LocalModelStorageService {
  private modelsDir: string;

  constructor() {
    this.modelsDir = `${RNFS.DocumentDirectoryPath}/models`;
    this.ensureModelDirectory();
  }

  /**
   * 获取模型目录
   */
  getModelsDir(): string {
    return this.modelsDir;
  }

  /**
   * 确保模型目录存在
   */
  async ensureModelDirectory(): Promise<void> {
    try {
      const dirExists = await RNFS.exists(this.modelsDir);
      if (!dirExists) {
        await RNFS.mkdir(this.modelsDir);
        console.log('Models directory created:', this.modelsDir);
      }
    } catch (error) {
      console.error('Error ensuring model directory:', error);
    }
  }

  /**
   * 列出本地模型
   */
  async listLocalModels(): Promise<LocalModelInfo[]> {
    try {
      const dirExists = await RNFS.exists(this.modelsDir);
      if (!dirExists) {
        return [];
      }
      const items = await RNFS.readDir(this.modelsDir);
      const models: LocalModelInfo[] = [];
      for (const item of items) {
        if (item.isFile() && (item.name.endsWith('.gguf') || item.name.endsWith('.bin'))) { // Adjust extensions as needed
          models.push({
            id: item.path, // Use path as id
            name: item.name,
            path: item.path,
            size: item.size,
            lastModified: (item.mtime || new Date()).getTime(), // Convert Date to timestamp
          });
        }
      }
      return models;
    } catch (error) {
      console.error('Error listing local models:', error);
      return [];
    }
  }

  /**
   * 删除本地模型
   */
  async deleteLocalModel(filePath: string): Promise<boolean> {
    try {
      const fileExists = await RNFS.exists(filePath);
      if (fileExists) {
        await RNFS.unlink(filePath);
        console.log('Model deleted:', filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting local model:', error);
      return false;
    }
  }

  /**
   * 获取模型路径
   */
  async getModelPath(modelName: string): Promise<string> {
    return `${this.modelsDir}/${modelName}`;
  }

  /**
   * 获取模型文件URI
   */
  getModelFileUri(modelName: string): string {
    return `file://${this.modelsDir}/${modelName}`;
  }

  /**
   * 检查模型是否存在
   */
  async modelExists(modelName: string): Promise<boolean> {
    const path = await this.getModelPath(modelName);
    return RNFS.exists(path);
  }

  /**
   * 获取模型大小
   */
  async getModelSize(modelPath: string): Promise<number> {
    try {
      const statResult = await RNFS.stat(modelPath);
      return statResult.size;
    } catch (error) {
      console.error('Error getting model size:', error);
      return 0;
    }
  }
}

// 单例模式导出
export default new LocalModelStorageService();

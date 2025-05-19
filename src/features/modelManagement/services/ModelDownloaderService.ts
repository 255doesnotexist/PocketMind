import RNFS from 'react-native-fs';
import LocalModelStorageService from './LocalModelStorageService';

class ModelDownloaderService {
  /**
   * 下载模型
   * @param url 下载URL
   * @param modelName 模型名称
   * @param onProgress 进度回调
   * @returns 文件路径或null
   */
  async downloadModel(
    url: string,
    modelName: string,
    onProgress: (progress: { bytesWritten: number; contentLength: number; percentage: number }) => void
  ): Promise<string | null> {
    try {
      await LocalModelStorageService.ensureModelDirectory();
      
      // 获取目标路径
      const destinationPath = await LocalModelStorageService.getModelPath(modelName);
      
      // 检查文件是否已存在
      const fileExists = await RNFS.exists(destinationPath);
      if (fileExists) {
        console.log(`Model ${modelName} already exists at ${destinationPath}`);
        return destinationPath;
      }
      
      // 开始下载
      console.log(`Downloading model from ${url} to ${destinationPath}`);
      
      const downloadOptions = {
        fromUrl: url,
        toFile: destinationPath,
        background: true,
        progressDivider: 1,
        begin: (res: { statusCode: number; contentLength: number; headers: any }) => {
          console.log('Download begin with status:', res.statusCode);
        },
        progress: (res: { contentLength: number; bytesWritten: number }) => {
          const percentage = Math.round((res.bytesWritten / res.contentLength) * 100);
          onProgress({
            bytesWritten: res.bytesWritten,
            contentLength: res.contentLength,
            percentage
          });
        },
      };

      const downloadResult = await RNFS.downloadFile(downloadOptions).promise;
      
      if (downloadResult.statusCode === 200) {
        console.log('Download complete:', destinationPath);
        return destinationPath;
      } else {
        console.error('Download failed with status:', downloadResult.statusCode);
        // 清理失败的下载
        if (await RNFS.exists(destinationPath)) {
          await RNFS.unlink(destinationPath);
        }
        return null;
      }
    } catch (error) {
      console.error('Error downloading model:', error);
      return null;
    }
  }
}

// 单例模式导出
export default new ModelDownloaderService();

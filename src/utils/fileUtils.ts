import { Platform } from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';

/**
 * 获取应用可读取的文件路径
 * @param assetPath 资源路径 (可以是require()的结果或字符串路径)
 * @returns 可读取的文件路径
 */
export async function getAppReadableFilePath(
  assetPath: string | number
): Promise<string> {
  if (typeof assetPath === 'number') {
    // 处理require()的结果
    // 在iOS和Android上，需要将资源复制到可访问的位置
    try {
      const fileName = `asset_${assetPath}`;
      const destPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
      
      // 检查是否已存在
      const exists = await RNFS.exists(destPath);
      if (exists) {
        return destPath;
      }
      
      // 使用ReactNative asset管理器解析真实路径
      await RNFS.copyFileAssets(assetPath.toString(), destPath);
      // 检查文件是否已复制到目标路径
      const destExists = await RNFS.exists(destPath);
      if (destExists) {
        return destPath;
      } else {
        // 如果复制后文件仍不存在，则可能表示原始资源路径无效或复制失败
        // 返回原始 assetPath 或抛出更具体的错误
        console.warn(`Failed to copy asset ${assetPath} to ${destPath}. Returning original asset path.`);
        return assetPath.toString(); 
      }
    } catch (error) {
      console.error('Error resolving asset path:', error);
      throw error;
    }
  } else {
    // 处理字符串路径
    // 如果是完整的文件路径，直接返回
    if (assetPath.startsWith('file://') || assetPath.startsWith('/')) {
      return assetPath;
    }
    
    // 如果是相对路径，拼接应用文档目录
    return `${RNFS.DocumentDirectoryPath}/${assetPath}`;
  }
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的大小字符串
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * 获取文件名
 * @param path 文件路径
 * @returns 文件名
 */
export function getFileName(path: string): string {
  if (!path) return '';
  
  // 处理file://协议
  const normalizedPath = path.startsWith('file://') 
    ? path.slice('file://'.length) 
    : path;
  
  // 处理Windows和POSIX路径
  const separator = Platform.OS === 'windows' ? '\\' : '/';
  const parts = normalizedPath.split(separator);
  
  return parts[parts.length - 1];
}

/**
 * 获取文件扩展名
 * @param path 文件路径
 * @returns 文件扩展名
 */
export function getFileExtension(path: string): string {
  const fileName = getFileName(path);
  const parts = fileName.split('.');
  
  if (parts.length <= 1) return '';
  
  return parts[parts.length - 1].toLowerCase();
}

/**
 * 确保目录存在
 * @param dirPath 目录路径
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    const exists = await RNFS.exists(dirPath);
    if (!exists) {
      await RNFS.mkdir(dirPath);
    }
  } catch (error) {
    console.error(`Error ensuring directory exists at ${dirPath}:`, error);
    throw error;
  }
}

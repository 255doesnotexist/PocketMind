import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, PermissionStatus } from 'react-native-permissions';

class PermissionsService {
  /**
   * 请求录音权限
   * @returns 权限状态
   */
  async requestRecordAudioPermission(): Promise<PermissionStatus> {
    try {
      const permission = Platform.select({
        android: PERMISSIONS.ANDROID.RECORD_AUDIO,
        ios: PERMISSIONS.IOS.MICROPHONE,
        default: PERMISSIONS.ANDROID.RECORD_AUDIO,
      });

      // 检查是否已有权限
      const checkResult = await check(permission);
      
      if (checkResult === RESULTS.GRANTED) {
        return PermissionStatus.GRANTED;
      }
      
      // 请求权限
      const requestResult = await request(permission);
      
      if (requestResult === RESULTS.GRANTED) {
        return PermissionStatus.GRANTED;
      } else {
        return PermissionStatus.DENIED;
      }
    } catch (error) {
      console.error('Error requesting record audio permission:', error);
      return PermissionStatus.UNDETERMINED;
    }
  }

  /**
   * 请求存储权限 (Android Only)
   * @returns 权限状态
   */
  async requestStoragePermission(): Promise<PermissionStatus> {
    if (Platform.OS !== 'android') {
      return PermissionStatus.GRANTED; // iOS不需要单独的存储权限
    }
    
    try {
      // Android 10+ 使用MANAGE_EXTERNAL_STORAGE
      // Android 9 及以下使用READ_EXTERNAL_STORAGE和WRITE_EXTERNAL_STORAGE
      const permission = 
        Platform.Version >= 29
          ? PERMISSIONS.ANDROID.MANAGE_EXTERNAL_STORAGE
          : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;

      // 检查是否已有权限
      const checkResult = await check(permission);
      
      if (checkResult === RESULTS.GRANTED) {
        return PermissionStatus.GRANTED;
      }
      
      // 请求权限
      const requestResult = await request(permission);
      
      if (requestResult === RESULTS.GRANTED) {
        return PermissionStatus.GRANTED;
      } else {
        return PermissionStatus.DENIED;
      }
    } catch (error) {
      console.error('Error requesting storage permission:', error);
      return PermissionStatus.UNDETERMINED;
    }
  }

  /**
   * 请求相机权限
   * @returns 权限状态
   */
  async requestCameraPermission(): Promise<PermissionStatus> {
    try {
      const permission = Platform.select({
        android: PERMISSIONS.ANDROID.CAMERA,
        ios: PERMISSIONS.IOS.CAMERA,
        default: PERMISSIONS.ANDROID.CAMERA,
      });

      // 检查是否已有权限
      const checkResult = await check(permission);
      
      if (checkResult === RESULTS.GRANTED) {
        return PermissionStatus.GRANTED;
      }
      
      // 请求权限
      const requestResult = await request(permission);
      
      if (requestResult === RESULTS.GRANTED) {
        return PermissionStatus.GRANTED;
      } else {
        return PermissionStatus.DENIED;
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return PermissionStatus.UNDETERMINED;
    }
  }
}

// 单例模式导出
export default new PermissionsService();

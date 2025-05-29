import AsyncStorage from '@react-native-async-storage/async-storage';
import { ModelProfile, DEFAULT_PROFILES } from '../config/modelProfiles';

const PROFILES_STORAGE_KEY = 'model_profiles';
const CURRENT_PROFILE_KEY = 'current_profile_id';

class ModelProfileService {
  /**
   * 获取所有配置文件
   */
  async getAllProfiles(): Promise<Record<string, ModelProfile>> {
    try {
      const stored = await AsyncStorage.getItem(PROFILES_STORAGE_KEY);
      if (stored) {
        const storedProfiles = JSON.parse(stored);
        // 合并默认配置和用户配置
        return { ...DEFAULT_PROFILES, ...storedProfiles };
      }
      return DEFAULT_PROFILES;
    } catch (error) {
      console.error('Error loading profiles:', error);
      return DEFAULT_PROFILES;
    }
  }

  /**
   * 获取单个配置文件
   */
  async getProfile(profileId: string): Promise<ModelProfile | null> {
    const profiles = await this.getAllProfiles();
    return profiles[profileId] || null;
  }

  /**
   * 保存配置文件
   */
  async saveProfile(profile: ModelProfile): Promise<boolean> {
    try {
      const profiles = await this.getAllProfiles();
      
      // 过滤掉默认配置，只保存用户自定义的
      const userProfiles: Record<string, ModelProfile> = {};
      for (const [id, prof] of Object.entries(profiles)) {
        if (!DEFAULT_PROFILES[id]) {
          userProfiles[id] = prof;
        }
      }
      
      userProfiles[profile.id] = profile;
      
      await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(userProfiles));
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      return false;
    }
  }

  /**
   * 删除配置文件
   */
  async deleteProfile(profileId: string): Promise<boolean> {
    try {
      // 不能删除默认配置
      if (DEFAULT_PROFILES[profileId]) {
        return false;
      }
      
      const profiles = await this.getAllProfiles();
      const userProfiles: Record<string, ModelProfile> = {};
      
      for (const [id, prof] of Object.entries(profiles)) {
        if (!DEFAULT_PROFILES[id] && id !== profileId) {
          userProfiles[id] = prof;
        }
      }
      
      await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(userProfiles));
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  }

  /**
   * 设置当前配置文件
   */
  async setCurrentProfile(profileId: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(CURRENT_PROFILE_KEY, profileId);
      return true;
    } catch (error) {
      console.error('Error setting current profile:', error);
      return false;
    }
  }

  /**
   * 获取当前配置文件ID
   */
  async getCurrentProfileId(): Promise<string> {
    try {
      const profileId = await AsyncStorage.getItem(CURRENT_PROFILE_KEY);
      return profileId || 'qwen3-0.6b'; // 默认使用 Qwen3-0.6B
    } catch (error) {
      console.error('Error getting current profile:', error);
      return 'qwen3-0.6b';
    }
  }

  /**
   * 获取当前配置文件
   */
  async getCurrentProfile(): Promise<ModelProfile> {
    const profileId = await this.getCurrentProfileId();
    const profile = await this.getProfile(profileId);
    return profile || DEFAULT_PROFILES['qwen3-0.6b'];
  }

  /**
   * 创建新的配置文件（基于现有配置）
   */
  createProfile(
    baseProfileId: string, 
    newId: string, 
    newName: string, 
    description?: string
  ): ModelProfile | null {
    const baseProfile = DEFAULT_PROFILES[baseProfileId];
    if (!baseProfile) {
      return null;
    }

    return {
      ...baseProfile,
      id: newId,
      name: newName,
      description: description || `基于 ${baseProfile.name} 的自定义配置`,
    };
  }
}

export default new ModelProfileService();

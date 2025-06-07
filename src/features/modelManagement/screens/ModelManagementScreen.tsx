import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Text,
  useTheme,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../store";
import {
  LocalModelInfo,
  addLocalModel,
  selectModel,
  setDownloadFilename,
  setDownloadState,
  setDownloadUrl,
  setLocalModels,
  updateDownloadProgress,
} from "../store/modelManagementSlice";
import LocalModelStorageService from "../services/LocalModelStorageService";
import ModelDownloaderService from "../services/ModelDownloaderService";
import { setCurrentModelId } from "../../modelSettings/store/settingsSlice";
import ModelListItem from "../components/ModelListItem";
import { PREDEFINED_MODELS } from "../../../config/modelProfiles"; // Added import
import * as RNFS from "@dr.pogodin/react-native-fs";

const ModelManagementScreen = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { localModels, isDownloading, downloadProgress } = useSelector(
    (state: RootState) => state.modelManagement
  );
  const currentModelId = useSelector(
    (state: RootState) => state.settings.currentModelId
  ); // Get currentModelId from settings slice

  const [downloadUrl, setLocalDownloadUrl] = useState<string>("");
  const [downloadFilename, setLocalDownloadFilename] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // 加载本地模型列表
  const loadLocalModels = async () => {
    setIsLoading(true);
    try {
      const models = await LocalModelStorageService.listLocalModels();
      dispatch(setLocalModels(models));

      // 如果有选定的模型，更新其isSelected属性
      if (currentModelId) {
        dispatch(selectModel(currentModelId));
      } else if (models.length > 0) {
        // 如果没有选定的模型但有可用模型，选择第一个
        dispatch(selectModel(models[0].id));
        dispatch(setCurrentModelId(models[0].id));
      }
    } catch (error) {
      console.error("Error loading local models:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 组件加载时获取本地模型列表
  useEffect(() => {
    loadLocalModels();
  }, []);

  // 选择模型
  const handleSelectModel = (model: LocalModelInfo) => {
    dispatch(selectModel(model.id));
    dispatch(setCurrentModelId(model.id));
  };

  // 删除模型
  const handleDeleteModel = async (model: LocalModelInfo) => {
    const deleted = await LocalModelStorageService.deleteLocalModel(model.path);
    if (deleted) {
      // 重新加载模型列表
      loadLocalModels();
    }
  };

  // 下载模型
  const handleDownloadModel = async () => {
    if (!downloadUrl || !downloadFilename) return;

    dispatch(setDownloadState(true));
    dispatch(setDownloadUrl(downloadUrl));
    dispatch(setDownloadFilename(downloadFilename));

    try {
      const modelPath = await ModelDownloaderService.downloadModel(
        downloadUrl,
        downloadFilename,
        (progress) => {
          dispatch(updateDownloadProgress(progress));
        }
      );

      if (modelPath) {
        // 获取模型信息
        const size = await LocalModelStorageService.getModelSize(modelPath);

        // 添加到本地模型列表
        const newModel: LocalModelInfo = {
          id: downloadFilename,
          name: downloadFilename,
          path: modelPath,
          size,
          lastModified: Date.now(),
        };

        dispatch(addLocalModel(newModel));
        dispatch(selectModel(newModel.id));
        dispatch(setCurrentModelId(newModel.id));

        // 清空输入
        setLocalDownloadUrl("");
        setLocalDownloadFilename("");
      }
    } catch (error) {
      console.error("Error downloading model:", error);
    } finally {
      dispatch(setDownloadState(false));
    }
  };

  // 下载示例Qwen3模型（0.6B）
  const handleDownloadQwen = async () => {
    // 小型Qwen3模型的示例URL
    const qwenModelKey = "qwen3-0.6b-gguf"; // Key for the predefined Qwen model
    const qwenPredefinedModel = PREDEFINED_MODELS[qwenModelKey];

    if (!qwenPredefinedModel) {
      console.error(`Predefined model ${qwenModelKey} not found.`);
      return;
    }

    const qwenUrl = qwenPredefinedModel.download_url;
    const qwenFilename = qwenPredefinedModel.filename;

    setLocalDownloadUrl(qwenUrl);
    setLocalDownloadFilename(qwenFilename); // Use filename from predefined model

    // 自动开始下载
    setTimeout(() => {
      handleDownloadModel();
    }, 500);
  };

  // 渲染内容
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>加载模型列表...</Text>
        </View>
      );
    }

    if (localModels.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>没有可用的本地模型</Text>
          <Button
            mode="contained"
            onPress={handleDownloadQwen}
            style={styles.downloadButton}
          >
            下载示例Qwen模型
          </Button>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.listContent}>
        {localModels.map((item) => (
          <ModelListItem
            key={item.id}
            model={item}
            onSelect={() => handleSelectModel(item)}
            onDelete={() => handleDeleteModel(item)}
          />
        ))}
      </ScrollView>
    );
  };

  // 渲染下载进度
  const renderDownloadProgress = () => {
    if (!isDownloading) return null;

    return (
      <Card style={styles.downloadCard}>
        <Card.Title title="下载中..." />
        <Card.Content>
          <Text>文件名: {downloadFilename}</Text>
          {downloadProgress && (
            <>
              <Text>
                {`${(downloadProgress.bytesWritten / (1024 * 1024)).toFixed(2)} MB / ${(downloadProgress.contentLength / (1024 * 1024)).toFixed(2)} MB`}
              </Text>
              <Text>{`${downloadProgress.percentage}%`}</Text>
            </>
          )}
          <ActivityIndicator
            style={styles.progressIndicator}
            color={theme.colors.primary}
          />
        </Card.Content>
      </Card>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {renderContent()}
      {renderDownloadProgress()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  downloadButton: {
    marginTop: 16,
  },
  downloadCard: {
    marginVertical: 16,
  },
  progressIndicator: {
    marginTop: 16,
  },
});

export default ModelManagementScreen;

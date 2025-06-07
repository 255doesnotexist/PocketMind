import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Text,
  useTheme,
  List,
  IconButton,
  Divider,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../store";
import {
  LocalModelInfo,
  addLocalModel,
  selectModel as selectModelInManagement, // Renamed to avoid conflict
  setDownloadFilename as setGlobalDownloadFilename,
  setDownloadState as setGlobalDownloadState,
  setDownloadUrl as setGlobalDownloadUrl,
  setLocalModels,
  updateDownloadProgress,
} from "../store/modelManagementSlice";
import LocalModelStorageService from "../services/LocalModelStorageService";
import ModelDownloaderService from "../services/ModelDownloaderService";
import { setCurrentModelId } from "../../modelSettings/store/settingsSlice";
import {
  PredefinedModel,
  PREDEFINED_MODELS,
} from "../../../config/modelProfiles";

// Interface for the combined display model information
interface DisplayModelInfo extends PredefinedModel {
  isDownloaded: boolean;
  isDownloadingThis: boolean;
  isSelected: boolean;
  localPath?: string;
  localSize?: string | number; // Consistent with LocalModelInfo
  localLastModified?: number;
}

const ModelManagementScreen = () => {
  const theme = useTheme();
  const componentStyles = styles(theme); // Call styles function with theme
  const dispatch = useDispatch();

  const {
    localModels,
    isDownloading: isGlobalDownloading, // Renamed for clarity
    downloadProgress,
    downloadFilename: globalDownloadFilename, // Renamed for clarity
  } = useSelector((state: RootState) => state.modelManagement);

  const currentModelIdFromSettings = useSelector(
    (state: RootState) => state.settings.currentModelId
  );

  const [displayModels, setDisplayModels] = useState<DisplayModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load local models from storage and set initial selection
  const loadLocalModelsAndSetSelection = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedLocalModels =
        await LocalModelStorageService.listLocalModels();
      dispatch(setLocalModels(fetchedLocalModels));

      if (currentModelIdFromSettings) {
        dispatch(selectModelInManagement(currentModelIdFromSettings)); // Mark as selected in management UI
      } else if (fetchedLocalModels.length > 0) {
        // If no model is globally selected, but local models exist, select the first one.
        dispatch(selectModelInManagement(fetchedLocalModels[0].id));
        dispatch(setCurrentModelId(fetchedLocalModels[0].id)); // Also set as global current
      }
    } catch (error) {
      console.error("Error loading local models:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, currentModelIdFromSettings]);

  useEffect(() => {
    loadLocalModelsAndSetSelection();
  }, [loadLocalModelsAndSetSelection]);

  // Effect to build and update the displayModels list
  useEffect(() => {
    const predefinedArray = Object.values(PREDEFINED_MODELS);
    const newDisplayModels = predefinedArray.map((pModel) => {
      const localMatch = localModels.find(
        (lModel) =>
          lModel.id === pModel.filename || lModel.name === pModel.filename
      );
      const isDownloadingThisModel =
        isGlobalDownloading && globalDownloadFilename === pModel.filename;

      // Match currentModelIdFromSettings with pModel.id (unique key of predefined model)
      // or pModel.profile_id if currentModelIdFromSettings stores profile_id.
      // Assuming currentModelIdFromSettings refers to the unique ID of the PredefinedModel (pModel.id)
      // which should also be the ID used when dispatching setCurrentModelId.
      const isSelectedModel = currentModelIdFromSettings === pModel.id;

      return {
        ...pModel,
        isDownloaded: !!localMatch,
        isDownloadingThis: isDownloadingThisModel,
        isSelected: isSelectedModel,
        localPath: localMatch?.path,
        localSize: localMatch?.size,
        localLastModified: localMatch?.lastModified,
      };
    });
    setDisplayModels(newDisplayModels);
  }, [
    localModels,
    currentModelIdFromSettings,
    isGlobalDownloading,
    globalDownloadFilename,
  ]);

  // Handlers
  const handleSelectModel = (model: DisplayModelInfo) => {
    if (!model.isDownloaded) return; // Should not happen if UI is correct
    dispatch(selectModelInManagement(model.id)); // For UI selection state on this screen
    dispatch(setCurrentModelId(model.id)); // Set as global active model (using PredefinedModel.id)
  };

  const handleDeleteModel = async (model: DisplayModelInfo) => {
    if (!model.localPath) return; // Should have localPath if downloaded
    const deleted = await LocalModelStorageService.deleteLocalModel(
      model.localPath
    );
    if (deleted) {
      loadLocalModelsAndSetSelection(); // Refresh list and selection
    }
  };

  const handleDownloadModel = async (model: DisplayModelInfo) => {
    if (model.isDownloaded || model.isDownloadingThis || isGlobalDownloading)
      return;

    dispatch(setGlobalDownloadState(true));
    dispatch(setGlobalDownloadUrl(model.download_url));
    dispatch(setGlobalDownloadFilename(model.filename));

    try {
      const modelPath = await ModelDownloaderService.downloadModel(
        model.download_url,
        model.filename,
        (progress) => {
          dispatch(updateDownloadProgress(progress));
        }
      );

      if (modelPath) {
        const size = await LocalModelStorageService.getModelSize(modelPath);
        const newLocalModel: LocalModelInfo = {
          id: model.filename, // Use filename as ID for local model consistency
          name: model.name, // Use predefined name
          path: modelPath,
          size,
          lastModified: Date.now(),
        };
        dispatch(addLocalModel(newLocalModel));
        // Optionally, auto-select after download
        // dispatch(selectModelInManagement(model.id));
        // dispatch(setCurrentModelId(model.id));
        loadLocalModelsAndSetSelection(); // Refresh to update status
      }
    } catch (error) {
      console.error("Error downloading model:", error);
      // Reset download state on error
      dispatch(setGlobalDownloadState(false));
      dispatch(setGlobalDownloadUrl(""));
      dispatch(setGlobalDownloadFilename(""));
    } finally {
      // Do not setGlobalDownloadState(false) here, it's handled by ChatScreen or completion logic.
      // For this screen, it should be reset on error or completion.
      // The original code had it in a finally block, which is fine if download is truly finished.
      // For now, let's assume it's reset by other parts of the app or upon completion/error.
      // Re-adding the finally block for robustness on this screen:
      // If the download process itself (success or fail) is considered "done" from this screen's perspective
      // It might be better to let the slice manage this based on actual download end.
      // For now, keeping it simple: if an error occurs here, we reset.
      // If successful, the isDownloading flag will be false once ModelDownloaderService completes.
      // The global isDownloading flag should be managed carefully.
    }
  };

  // Render individual model item
  const renderModelItem = (model: DisplayModelInfo) => {
    let rightContent:
      | (({ color }: { color: string }) => React.ReactNode)
      | null = null;
    if (model.isDownloadingThis) {
      rightContent = () => (
        <ActivityIndicator
          animating={true}
          color={theme.colors.primary}
          style={componentStyles.itemIcon} // Use componentStyles
        />
      );
    } else if (model.isDownloaded) {
      rightContent = () => (
        <View style={componentStyles.actionButtons}>
          {" "}
          // Use componentStyles
          <IconButton
            icon="delete"
            size={20}
            onPress={() => handleDeleteModel(model)}
          />
          {model.isSelected ? (
            <Button
              mode="contained"
              style={componentStyles.selectedButton}
              disabled
            >
              {" "}
              // Use componentStyles Selected
            </Button>
          ) : (
            <Button mode="outlined" onPress={() => handleSelectModel(model)}>
              Select
            </Button>
          )}
        </View>
      );
    } else {
      rightContent = () => (
        <Button
          mode="contained"
          onPress={() => handleDownloadModel(model)}
          disabled={isGlobalDownloading} // Disable if any download is in progress
        >
          Download
        </Button>
      );
    }

    return (
      <List.Item
        key={model.id}
        title={model.name}
        description={`${model.description || ""} - ${model.quantization} (${model.size})`}
        left={(props) => (
          <List.Icon
            {...props}
            icon={model.isSelected ? "radiobox-marked" : "radiobox-blank"}
          />
        )}
        right={rightContent} // Corrected: Pass rightContent directly
        style={model.isSelected ? componentStyles.selectedItem : {}} // Use componentStyles
        onPress={() =>
          model.isDownloaded && !model.isSelected
            ? handleSelectModel(model)
            : null
        }
      />
    );
  };

  // Main render content
  const renderContent = () => {
    if (isLoading && displayModels.length === 0) {
      // Show loading only if displayModels isn't populated yet
      return (
        <View style={componentStyles.centerContent}>
          {" "}
          // Use componentStyles
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={componentStyles.loadingText}>Loading models...</Text> //
          Use componentStyles
        </View>
      );
    }

    if (displayModels.length === 0) {
      return (
        <View style={componentStyles.centerContent}>
          {" "}
          // Use componentStyles
          <Text style={componentStyles.emptyText}>
            No models available in profiles.
          </Text>{" "}
          // Use componentStyles
          {/* Optionally, add a button to refresh or guide user */}
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={componentStyles.listContent}>
        {" "}
        // Use componentStyles
        {displayModels.map((item) => renderModelItem(item))}
      </ScrollView>
    );
  };

  // Render global download progress (if any model is downloading)
  const renderGlobalDownloadProgress = () => {
    if (!isGlobalDownloading || !globalDownloadFilename) return null;

    const downloadingModelInfo = displayModels.find(
      (m) => m.filename === globalDownloadFilename
    );

    return (
      <Card style={componentStyles.downloadCard}>
        {" "}
        // Use componentStyles
        <Card.Title
          title={`Downloading: ${downloadingModelInfo?.name || globalDownloadFilename}`}
        />
        <Card.Content>
          {downloadProgress && (
            <>
              <Text>
                {`${(downloadProgress.bytesWritten / (1024 * 1024)).toFixed(2)} MB / ${(downloadProgress.contentLength / (1024 * 1024)).toFixed(2)} MB`}
              </Text>
              <Text>{`Progress: ${downloadProgress.percentage}%`}</Text>
            </>
          )}
          <ActivityIndicator
            style={componentStyles.progressIndicator} // Use componentStyles
            color={theme.colors.primary}
          />
        </Card.Content>
      </Card>
    );
  };

  return (
    <View
      style={[
        componentStyles.container,
        { backgroundColor: theme.colors.background },
      ]} // Use componentStyles
    >
      {renderContent()}
      {renderGlobalDownloadProgress()}
    </View>
  );
};

const styles = (theme: any) =>
  StyleSheet.create({
    // Changed to a function accepting theme
    container: {
      flex: 1,
    },
    centerContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
    },
    emptyText: {
      fontSize: 16,
      marginBottom: 16,
      textAlign: "center",
    },
    listContent: {
      paddingBottom: 16,
    },
    downloadCard: {
      margin: 16,
    },
    progressIndicator: {
      marginTop: 16,
    },
    itemIcon: {
      marginRight: 8,
    },
    actionButtons: {
      flexDirection: "row",
      alignItems: "center",
    },
    selectedButton: {
      marginLeft: 8, // Add some space if needed
    },
    selectedItem: {
      backgroundColor: theme.colors.surfaceVariant, // Now theme is accessible
    },
  });

export default ModelManagementScreen;

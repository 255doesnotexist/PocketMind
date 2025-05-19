import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, Divider, SegmentedButtons, Slider, Text, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { 
  resetNonThinkingParamsToDefault, 
  resetThinkingParamsToDefault, 
  updateNonThinkingParam, 
  updateThinkingParam 
} from '../store/settingsSlice';

const ModelSettingsScreen = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { paramsThinking, paramsNonThinking, currentModelId } = useSelector((state: RootState) => state.settings);
  
  // 用于切换编辑模式（思考模式vs非思考模式）
  const [editMode, setEditMode] = useState<'thinking' | 'nonThinking'>('nonThinking');
  
  // 获取当前正在编辑的参数
  const currentParams = editMode === 'thinking' ? paramsThinking : paramsNonThinking;
  
  // 更新参数值
  const updateParam = (paramName: string, value: number) => {
    if (editMode === 'thinking') {
      dispatch(updateThinkingParam({ paramName: paramName as any, value }));
    } else {
      dispatch(updateNonThinkingParam({ paramName: paramName as any, value }));
    }
  };
  
  // 重置为默认参数
  const resetToDefault = () => {
    if (editMode === 'thinking') {
      dispatch(resetThinkingParamsToDefault());
    } else {
      dispatch(resetNonThinkingParamsToDefault());
    }
  };

  // 渲染单个参数控制器
  const renderParamControl = (
    label: string,
    paramName: string,
    value: number,
    min: number,
    max: number,
    step: number = 0.1
  ) => {
    return (
      <View style={styles.sliderContainer} key={paramName}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value.toFixed(2)}</Text>
        </View>
        <Slider
          value={value}
          onValueChange={(value) => updateParam(paramName, value)}
          minimumValue={min}
          maximumValue={max}
          step={step}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.surfaceVariant}
        />
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Title title="当前模型" />
        <Card.Content>
          <Text style={styles.modelName}>{currentModelId || '未选择模型'}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="参数设置" />
        <Card.Content>
          <SegmentedButtons
            value={editMode}
            onValueChange={(value) => setEditMode(value as 'thinking' | 'nonThinking')}
            buttons={[
              { value: 'nonThinking', label: '标准模式' },
              { value: 'thinking', label: '思考模式' }
            ]}
            style={styles.segmentedButtons}
          />

          <Divider style={styles.divider} />

          <Text style={styles.modeTitle}>
            {editMode === 'thinking' ? '思考模式参数' : '标准模式参数'}
          </Text>

          {renderParamControl('温度 (Temperature)', 'temperature', currentParams.temperature, 0, 1)}
          {renderParamControl('Top P', 'top_p', currentParams.top_p, 0, 1)}
          {renderParamControl('Top K', 'top_k', currentParams.top_k, 1, 100, 1)}
          {renderParamControl('Min P', 'min_p', currentParams.min_p, 0, 0.5)}
          {renderParamControl('Presence Penalty', 'presence_penalty', currentParams.presence_penalty, 0, 2)}
          {renderParamControl('最大生成Token数', 'max_tokens', currentParams.max_tokens, 256, 8192, 128)}

          <Button
            mode="contained"
            onPress={resetToDefault}
            style={styles.resetButton}
          >
            恢复默认参数
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '500',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  divider: {
    marginBottom: 16,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sliderContainer: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  resetButton: {
    marginTop: 8,
  },
});

export default ModelSettingsScreen;

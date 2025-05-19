import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Card, IconButton, Text, useTheme } from 'react-native-paper';
import { LocalModelInfo } from '../store/modelManagementSlice';

interface ModelListItemProps {
  model: LocalModelInfo;
  onSelect: () => void;
  onDelete: () => void;
}

const ModelListItem: React.FC<ModelListItemProps> = ({ 
  model, 
  onSelect, 
  onDelete 
}) => {
  const theme = useTheme();

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化日期
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <Card 
      style={[
        styles.card, 
        model.isSelected && { borderColor: theme.colors.primary, borderWidth: 2 }
      ]}
      onPress={onSelect}
    >
      <Card.Content style={styles.content}>
        <Avatar.Icon 
          icon="brain" 
          size={40} 
          color={theme.colors.onPrimary}
          style={{ backgroundColor: theme.colors.primary }}
        />
        
        <View style={styles.details}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="middle">
            {model.name}
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>
              {formatFileSize(model.size)}
            </Text>
            <Text style={styles.infoText}>
              {formatDate(model.lastModified)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {model.isSelected ? (
            <IconButton
              icon="check-circle"
              iconColor={theme.colors.primary}
              size={24}
            />
          ) : (
            <IconButton
              icon="radiobox-blank"
              iconColor={theme.colors.outline}
              size={24}
              onPress={onSelect}
            />
          )}
          
          <IconButton
            icon="delete"
            iconColor={theme.colors.error}
            size={24}
            onPress={onDelete}
          />
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoText: {
    fontSize: 12,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
  },
});

export default ModelListItem;

## 构建说明

### 准备工作

1. 确保安装了所有依赖：
   ```bash
   npm install
   ```

2. 在构建之前，请运行以下命令以同步配置：
   ```bash
   npm run prebuild
   ```

   这一步非常重要，它确保 `app.config.js` 中的配置与本地项目 (android/ios) 同步。

### 启动应用

```bash
# 启动 Android 应用
npm run android

# 启动 iOS 应用
npm run ios

# 启动 Metro 服务器
npm run start
```

## 本地构建 Android 调试应用

```bash
npx expo run:android
```

### 注意事项

- 如果修改了 `app.config.js` 中的配置（如图标、启动屏幕等），请记得在构建前运行 `npm run prebuild`
- 项目使用了一些需要特别关注的依赖包：
  - react-native-fs (已知在新架构上可能有兼容性问题)
  - llama.rn 和 whisper.rn (需要特殊构建步骤，请参考上面的说明)
// 模型文件名配置
export const DEFAULT_QWEN_MODEL_FILENAME = "Qwen3-0.6B-Q8_0.gguf";

// 推理模式参数配置
export const DEFAULT_MODEL_PARAMS_NON_THINKING = {
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  min_p: 0.05,
  presence_penalty: 0.0,
  max_tokens: 2048,
  stop: ["</s>", "<|im_end|>"],
};

export const DEFAULT_MODEL_PARAMS_THINKING = {
  temperature: 0.2,
  top_p: 0.6,
  top_k: 40,
  min_p: 0.1,
  presence_penalty: 0.0,
  max_tokens: 4096,
  stop: ["</s>", "<|im_end|>"],
};

// Qwen系列模型聊天模板
export const QWEN_CHAT_TEMPLATE = {
  system: "<|im_start|>system\n{system_message}<|im_end|>\n",
  user: "<|im_start|>user\n{message}<|im_end|>\n",
  assistant: "<|im_start|>assistant\n{message}<|im_end|>\n",
};

// 默认系统提示词
export const DEFAULT_SYSTEM_MESSAGE = "你是一个由阿里云开发的AI助手。请尽可能提供有帮助、安全和真实的回复。";

// Qwen特殊指令
export const THINKING_COMMAND = "/think";
export const NO_THINKING_COMMAND = "/no_think";

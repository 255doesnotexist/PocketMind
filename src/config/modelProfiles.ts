// Model profiles configuration system
export interface ModelParams {
  temperature: number;
  top_p: number;
  top_k: number;
  min_p: number;
  presence_penalty: number;
  max_tokens: number;
  stop: string[];
}

export interface ChatTemplate {
  system: string;
  user: string;
  assistant: string;
  tool_start?: string;
  tool_end?: string;
  // Full template for complex models like Qwen
  full_template?: string;
}

export interface ModelProfile {
  id: string;
  name: string;
  description?: string;
  chat_template: ChatTemplate;
  default_system_message: string;
  params_thinking: ModelParams;
  params_non_thinking: ModelParams;
  supports_thinking: boolean;
  supports_tools: boolean;
  thinking_command?: string;
  no_thinking_command?: string;
}

export interface PredefinedModel {
  id: string;
  name: string;
  description: string;
  size: string;
  quantization: string;
  download_url: string;
  filename: string;
  profile_id: string;
  provider: string; // 'huggingface' | 'modelscope'
}

// Default Qwen 3 0.6B profile
export const DEFAULT_QWEN_PROFILE: ModelProfile = {
  id: 'qwen3-0.6b',
  name: 'Qwen3 0.6B',
  description: 'Default profile for Qwen3 0.6B model',
  chat_template: {
    system: "<|im_start|>system\n{system_message}<|im_end|>\n",
    user: "<|im_start|>user\n{message}<|im_end|>\n",
    assistant: "<|im_start|>assistant\n{message}<|im_end|>\n",
    full_template: `{{- if .Messages }}
{{- if or .System .Tools }}<|im_start|>system
{{- if .System }}
{{ .System }}
{{- end }}
{{- if .Tools }}

# Tools

You may call one or more functions to assist with the user query.

You are provided with function signatures within <tools></tools> XML tags:
<tools>
{{- range .Tools }}
{"type": "function", "function": {{ .Function }}}
{{- end }}
</tools>

For each function call, return a json object with function name and arguments within <tool_call></tool_call> XML tags:
<tool_call>
{"name": <function-name>, "arguments": <args-json-object>}
</tool_call>
{{- end }}<|im_end|>
{{ end }}
{{- range $i, $_ := .Messages }}
{{- $last := eq (len (slice $.Messages $i)) 1 -}}
{{- if eq .Role "user" }}<|im_start|>user
{{ .Content }}<|im_end|>
{{ else if eq .Role "assistant" }}<|im_start|>assistant
{{ if .Content }}{{ .Content }}
{{- else if .ToolCalls }}<tool_call>
{{ range .ToolCalls }}{"name": "{{ .Function.Name }}", "arguments": {{ .Function.Arguments }}}
{{ end }}</tool_call>
{{- end }}{{ if not $last }}<|im_end|>
{{ end }}
{{- else if eq .Role "tool" }}<|im_start|>user
<tool_response>
{{ .Content }}
</tool_response><|im_end|>
{{ end }}
{{- if and (ne .Role "assistant") $last }}<|im_start|>assistant
{{ end }}
{{- end }}
{{- else }}
{{- if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{ if .Prompt }}<|im_start|>user
{{ .Prompt }}<|im_end|>
{{ end }}<|im_start|>assistant
{{ end }}{{ .Response }}{{ if .Response }}<|im_end|>{{ end }}`
  },
  default_system_message: "你是一个由阿里云开发的AI助手。请尽可能提供有帮助、安全和真实的回复。",
  params_thinking: {
    temperature: 0.2,
    top_p: 0.6,
    top_k: 40,
    min_p: 0.1,
    presence_penalty: 0.0,
    max_tokens: 4096,
    stop: ["</s>", "<|im_end|>"],
  },
  params_non_thinking: {
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    min_p: 0.05,
    presence_penalty: 0.0,
    max_tokens: 2048,
    stop: ["</s>", "<|im_end|>"],
  },
  supports_thinking: true,
  supports_tools: true,
  thinking_command: "/think",
  no_thinking_command: "/no_think"
};

// Gemma profile
export const GEMMA_PROFILE: ModelProfile = {
  id: 'gemma-3',
  name: 'Gemma 3',
  description: 'Profile for Google Gemma 3 models',
  chat_template: {
    system: "<start_of_turn>system\n{system_message}<end_of_turn>\n",
    user: "<start_of_turn>user\n{message}<end_of_turn>\n",
    assistant: "<start_of_turn>model\n{message}<end_of_turn>\n",
  },
  default_system_message: "You are a helpful AI assistant created by Google.",
  params_thinking: {
    temperature: 0.3,
    top_p: 0.8,
    top_k: 40,
    min_p: 0.05,
    presence_penalty: 0.0,
    max_tokens: 3072,
    stop: ["<end_of_turn>"],
  },
  params_non_thinking: {
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    min_p: 0.05,
    presence_penalty: 0.0,
    max_tokens: 2048,
    stop: ["<end_of_turn>"],
  },
  supports_thinking: false,
  supports_tools: false,
};

// Phi profile  
export const PHI_PROFILE: ModelProfile = {
  id: 'phi-4',
  name: 'Phi 4',
  description: 'Profile for Microsoft Phi 4 models',
  chat_template: {
    system: "<|system|>\n{system_message}<|end|>\n",
    user: "<|user|>\n{message}<|end|>\n",
    assistant: "<|assistant|>\n{message}<|end|>\n",
  },
  default_system_message: "You are a helpful AI assistant created by Microsoft.",
  params_thinking: {
    temperature: 0.3,
    top_p: 0.8,
    top_k: 40,
    min_p: 0.05,
    presence_penalty: 0.0,
    max_tokens: 3072,
    stop: ["<|end|>"],
  },
  params_non_thinking: {
    temperature: 0.8,
    top_p: 0.95,
    top_k: 40,
    min_p: 0.05,
    presence_penalty: 0.0,
    max_tokens: 2048,
    stop: ["<|end|>"],
  },
  supports_thinking: false,
  supports_tools: false,
};

// Default profiles registry
export const DEFAULT_PROFILES: Record<string, ModelProfile> = {
  'qwen3-0.6b': DEFAULT_QWEN_PROFILE,
  'gemma-3': GEMMA_PROFILE,
  'phi-4': PHI_PROFILE,
};

// Predefined models for download
export const PREDEFINED_MODELS: PredefinedModel[] = [
  // Qwen models
  {
    id: 'qwen3-0.6b-q8',
    name: 'Qwen3 0.6B Q8_0',
    description: '轻量级高质量模型，适合移动设备',
    size: '0.6B',
    quantization: 'Q8_0',
    download_url: 'https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q8_0.gguf',
    filename: 'Qwen3-0.6B-Q8_0.gguf',
    profile_id: 'qwen3-0.6b',
    provider: 'huggingface'
  },
  {
    id: 'qwen3-1.7b-q8',
    name: 'Qwen3 1.7B Q8_0',
    description: '中等规模模型，平衡性能与质量',
    size: '1.7B',
    quantization: 'Q8_0',
    download_url: 'https://huggingface.co/unsloth/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q8_0.gguf',
    filename: 'Qwen3-1.7B-Q8_0.gguf',
    profile_id: 'qwen3-0.6b',
    provider: 'huggingface'
  },
  {
    id: 'qwen3-4b-q6',
    name: 'Qwen3 4B Q6_K',
    description: '高性能模型，适合复杂任务',
    size: '4B',
    quantization: 'Q6_K',
    download_url: 'https://huggingface.co/unsloth/Qwen3-4B-GGUF/resolve/main/Qwen3-4B-Q6_K.gguf',
    filename: 'Qwen3-4B-Q6_K.gguf',
    profile_id: 'qwen3-0.6b',
    provider: 'huggingface'
  },
  {
    id: 'qwen2.5-omni-3b-q6',
    name: 'Qwen2.5 Omni 3B Q6_K',
    description: '多模态模型，支持语音和图像',
    size: '3B',
    quantization: 'Q6_K',
    download_url: 'https://modelscope.cn/models/unsloth/Qwen2.5-Omni-3B-GGUF/resolve/main/Qwen2.5-Omni-3B-Q6_K.gguf',
    filename: 'Qwen2.5-Omni-3B-Q6_K.gguf',
    profile_id: 'qwen3-0.6b',
    provider: 'modelscope'
  },
  {
    id: 'qwen2.5-omni-7b-q4',
    name: 'Qwen2.5 Omni 7B Q4_K_M',
    description: '大型多模态模型，最佳质量',
    size: '7B',
    quantization: 'Q4_K_M',
    download_url: 'https://modelscope.cn/models/unsloth/Qwen2.5-Omni-7B-GGUF/resolve/main/Qwen2.5-Omni-7B-Q4_K_M.gguf',
    filename: 'Qwen2.5-Omni-7B-Q4_K_M.gguf',
    profile_id: 'qwen3-0.6b',
    provider: 'modelscope'
  },
  // Gemma models
  {
    id: 'gemma-3-1b-q4',
    name: 'Gemma 3 1B Q4_0',
    description: 'Google 轻量级模型',
    size: '1B',
    quantization: 'Q4_0',
    download_url: 'https://huggingface.co/google/gemma-3-1b-it-qat-q4_0-gguf/resolve/main/gemma-3-1b-it-qat-q4_0.gguf',
    filename: 'gemma-3-1b-it-qat-q4_0.gguf',
    profile_id: 'gemma-3',
    provider: 'huggingface'
  },
  {
    id: 'gemma-3-4b-q4',
    name: 'Gemma 3 4B Q4_0',
    description: 'Google 中等规模模型',
    size: '4B',
    quantization: 'Q4_0',
    download_url: 'https://huggingface.co/google/gemma-3-4b-it-qat-q4_0-gguf/resolve/main/gemma-3-4b-it-qat-q4_0.gguf',
    filename: 'gemma-3-4b-it-qat-q4_0.gguf',
    profile_id: 'gemma-3',
    provider: 'huggingface'
  },
  // Phi models
  {
    id: 'phi-4-q4',
    name: 'Phi 4 Q4_K_M',
    description: 'Microsoft 高效模型',
    size: '14B',
    quantization: 'Q4_K_M',
    download_url: 'https://huggingface.co/microsoft/phi-4-gguf/resolve/main/phi-4-Q4_K_M.gguf',
    filename: 'phi-4-Q4_K_M.gguf',
    profile_id: 'phi-4',
    provider: 'huggingface'
  }
];

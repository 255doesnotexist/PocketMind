import { Message } from "../store/chatSlice";
import {
  DEFAULT_SYSTEM_MESSAGE,
  QWEN_CHAT_TEMPLATE,
  THINKING_COMMAND,
  NO_THINKING_COMMAND,
} from "../../../config/modelConfig";
import ChatTemplateParser from "../../../services/ChatTemplateParser";
import ModelProfileService from "../../../services/ModelProfileService";
import { ModelProfile } from "../../../config/modelProfiles";

/**
 * 解析Qwen思考标签
 * @param text 输入文本
 * @returns 可见内容和思考内容
 */
export const parseQwenThinkingTags = (
  text: string
): { visibleContent: string; thinkingContent: string | null } => {
  console.log(text);
  // 匹配<think>...</think>标签
  const thinkingRegex = /(<think>)?([\s\S]*?)<\/think>/;
  const match = text.match(thinkingRegex);
  text = text.replace(/<\|im_start\|>/g, "").replace(/<\|im_end\|>/g, "");
  text = text.replace(/<think>/g, "");

  if (match) {
    const thinkingContent = match[2].trim();
    // 移除思考内容，返回可见部分
    const visibleContent = text.replace(thinkingRegex, "").trim();
    return { visibleContent, thinkingContent };
  }

  return { visibleContent: text, thinkingContent: null };
};

/**
 * 为当前模型格式化聊天记录
 * @param userInput 用户输入
 * @param history 聊天记录
 * @param isThinkingMode 是否思考模式
 * @param isThinkingCommand 是否有思考命令
 * @param systemMessage 自定义系统消息
 * @param profileId 模型配置ID
 * @returns 格式化后的prompt
 */
export const formatPromptForModel = async (
  userInput: string,
  history: Message[],
  isThinkingMode: boolean,
  isThinkingCommand?: boolean,
  systemMessage?: string,
  profileId?: string
): Promise<string> => {
  // 获取当前模型配置
  const profile = profileId
    ? await ModelProfileService.getProfile(profileId)
    : await ModelProfileService.getCurrentProfile();

  if (!profile) {
    // 回退到原有的 Qwen 格式
    return formatPromptForQwen(
      userInput,
      history,
      isThinkingMode,
      isThinkingCommand
    );
  }

  // 使用配置中的系统消息或传入的系统消息
  const finalSystemMessage = systemMessage || profile.default_system_message;

  // 处理用户输入
  let processedUserInput = userInput;

  // 如果模型支持思考模式，处理思考命令
  if (profile.supports_thinking) {
    const thinkingCmd = profile.thinking_command || THINKING_COMMAND;
    const noThinkingCmd = profile.no_thinking_command || NO_THINKING_COMMAND;

    if (!isThinkingCommand && isThinkingMode) {
      processedUserInput = `${thinkingCmd}\n${processedUserInput}`;
    } else if (!isThinkingCommand && !isThinkingMode) {
      processedUserInput = `${noThinkingCmd}\n${processedUserInput}`;
    }
  }

  // 构建消息历史（包含新的用户输入）
  const allMessages: Message[] = [
    ...history,
    {
      id: `temp-${Date.now()}`,
      role: "user" as const,
      content: processedUserInput,
      timestamp: Date.now(),
    },
  ];

  // 使用模板解析器格式化
  return ChatTemplateParser.formatChatHistory(
    profile,
    allMessages,
    finalSystemMessage
  );
};

/**
 * 为Qwen模型格式化聊天记录（保持兼容性）
 * @param userInput 用户输入
 * @param history 聊天记录
 * @param isThinkingMode 是否思考模式
 * @param isThinkingCommand 是否有思考命令
 * @returns 格式化后的prompt
 */
export const formatPromptForQwen = (
  userInput: string,
  history: Message[],
  isThinkingMode: boolean,
  isThinkingCommand?: boolean
): string => {
  // 系统提示词
  let prompt = QWEN_CHAT_TEMPLATE.system.replace(
    "{system_message}",
    DEFAULT_SYSTEM_MESSAGE
  );

  // 添加聊天历史
  for (const message of history) {
    const template =
      message.role === "user"
        ? QWEN_CHAT_TEMPLATE.user
        : QWEN_CHAT_TEMPLATE.assistant;
    prompt += template.replace("{message}", message.content);
  }

  // 处理用户输入
  let processedUserInput = userInput;

  // 如果有思考命令，则不需要在此处添加
  // 如果没有思考命令，但是处于思考模式，则添加思考命令
  if (!isThinkingCommand && isThinkingMode) {
    processedUserInput = `${THINKING_COMMAND}\n${processedUserInput}`;
  }
  // 如果没有思考命令，且不处于思考模式，则添加非思考命令
  else if (!isThinkingCommand && !isThinkingMode) {
    processedUserInput = `${NO_THINKING_COMMAND}\n${processedUserInput}`;
  }

  // 添加处理后的用户输入
  prompt += QWEN_CHAT_TEMPLATE.user.replace("{message}", processedUserInput);

  return prompt;
};

/**
 * 检查输入是否为思考指令
 * @param input 用户输入
 * @returns {isThinkingCommand, command, restContent, shouldActivateThinking}
 */
export const checkThinkingCommand = (
  input: string
): {
  isThinkingCommand: boolean;
  command: string | null;
  restContent: string;
  shouldActivateThinking: boolean | null;
} => {
  const trimmedInput = input.trim();

  // 检查是否为/think命令
  if (trimmedInput.startsWith(THINKING_COMMAND)) {
    const restContent = trimmedInput.substring(THINKING_COMMAND.length).trim();
    return {
      isThinkingCommand: true,
      command: THINKING_COMMAND,
      restContent,
      shouldActivateThinking: true,
    };
  }

  // 检查是否为/no_think命令
  if (trimmedInput.startsWith(NO_THINKING_COMMAND)) {
    const restContent = trimmedInput
      .substring(NO_THINKING_COMMAND.length)
      .trim();
    return {
      isThinkingCommand: true,
      command: NO_THINKING_COMMAND,
      restContent,
      shouldActivateThinking: false,
    };
  }

  // 不是命令
  return {
    isThinkingCommand: false,
    command: null,
    restContent: trimmedInput,
    shouldActivateThinking: null,
  };
};

import { Message } from "../store/chatSlice";
import {
  ModelProfile,
  DEFAULT_QWEN_PROFILE,
  DEFAULT_PROFILES,
  ChatTemplate,
} from "../../../config/modelProfiles";
import ModelProfileServiceInstance from "../../../services/ModelProfileService";
import ChatTemplateParserInstance from "../../../services/ChatTemplateParser"; // Added import

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
  text = text.replace(/<\|im_start\|>/g, "").replace(/<\|im_end\|>/g, "");
  text = text.replace(/<think>/g, "");
  const thinkingRegex = /(<think>)?([\s\S]*?)<\/think>/; // Corrected regex
  const match = text.match(thinkingRegex);

  if (match && match[2]) {
    // Ensure match[2] exists
    const thinkingContent = match[2].trim();
    // 移除思考内容，返回可见部分
    const visibleContent = text.replace(thinkingRegex, "").trim();
    return { visibleContent, thinkingContent };
  }

  return { visibleContent: text, thinkingContent: null };
};

/**
 * 为当前模型格式化聊天记录
 * @param userInput 用户原始输入
 * @param history 聊天记录
 * @param isThinkingModeActive UI控制的思考模式状态
 * @param customSystemMessage 自定义系统消息
 * @param profileId 模型配置ID
 * @returns 格式化后的prompt
 */
export const formatPromptForModel = async (
  userInput: string, // Raw user input from the text field
  history: Message[],
  isThinkingModeActive: boolean, // Current thinking mode state from the UI
  customSystemMessage?: string,
  profileId?: string
): Promise<string> => {
  const profile: ModelProfile | null = profileId
    ? await ModelProfileServiceInstance.getProfile(profileId)
    : await ModelProfileServiceInstance.getCurrentProfile();

  if (!profile) {
    console.error("Model profile not found, using fallback.");
    return userInput; // Or a default formatted prompt
  }

  const systemMessageToUse =
    customSystemMessage || profile.default_system_message;

  // 1. Extract any command already present in the user's raw input
  const {
    command: extractedCommand,
    content: contentWithoutCommand,
    isThinking: thinkingStateFromCommand,
  } = extractCommandFromInput(userInput, profile);

  let processedUserInput = contentWithoutCommand;

  // 2. Determine effective thinking status and prepend command if necessary
  const currentMessageIsThinking =
    extractedCommand !== null ? thinkingStateFromCommand : isThinkingModeActive;

  if (profile.supports_thinking && !extractedCommand) {
    // Only prepend if no command was in userInput
    if (
      currentMessageIsThinking === true &&
      typeof profile.thinking_command === "string"
    ) {
      processedUserInput = `${profile.thinking_command} ${contentWithoutCommand}`;
    } else if (
      currentMessageIsThinking === false &&
      typeof profile.no_thinking_command === "string"
    ) {
      processedUserInput = `${profile.no_thinking_command} ${contentWithoutCommand}`;
    }
  }
  // At this point, processedUserInput is the user's message, potentially prefixed with a command.

  // 3. Prepare messages for the ChatTemplateParser
  let messagesForParser: Message[] = [...history];
  messagesForParser.push({
    id: "current_user_input", // Placeholder ID
    role: "user",
    content: processedUserInput,
    timestamp: Date.now(), // Placeholder timestamp
    // Add other mandatory Message fields if any, with placeholder/default values
    // e.g., model: profile.id, status: 'sent' if these are part of Message type
  });

  // 4. Use ChatTemplateParser to format the full prompt
  try {
    // Assuming ChatTemplateParserInstance.formatChatHistory can take an optional system message string
    const formattedPrompt = await ChatTemplateParserInstance.formatChatHistory(
      profile,
      messagesForParser, // Pass the history + current user input
      systemMessageToUse // Pass system message as a separate optional argument
    );
    return formattedPrompt;
  } catch (error) {
    console.error("Error formatting prompt with ChatTemplateParser:", error);
    // Fallback to a very basic concatenation if parser fails
    const fallbackHistory = history
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\\n");
    return `${systemMessageToUse ? systemMessageToUse + "\\n" : ""}${fallbackHistory}\\nuser: ${processedUserInput}\\nassistant:`;
  }
};

/**
 * 为Qwen模型格式化聊天记录（保持兼容性）
 * @param userInput 用户输入
 * @param history 聊天记录
 * @param systemMessage 自定义系统消息
 * @param isThinkingMode 是否思考模式
 * @returns 格式化后的prompt
 */
export const formatPromptForQwen = (
  prompt: string,
  history: Message[],
  systemMessage?: string
  // isThinkingMode is not directly used here as commands are expected to be in profile
): string => {
  console.warn(
    "formatPromptForQwen is deprecated. Use formatPromptForModel with a Qwen profile instead."
  );
  const qwenProfile = DEFAULT_PROFILES["qwen3-0.6b"] || DEFAULT_QWEN_PROFILE;
  const sysMsg = systemMessage || qwenProfile.default_system_message;

  let fullHistory = history
    .map((msg) => {
      if (msg.role === "user") {
        return qwenProfile.chat_template.user.replace("{message}", msg.content);
      } else if (msg.role === "assistant") {
        return qwenProfile.chat_template.assistant.replace(
          "{message}",
          msg.content
        );
      }
      return "";
    })
    .join(""); // Removed extra newline joiner, template should handle spacing

  // Constructing based on a simplified understanding of Qwen's typical structure
  // Assumes chat_template.system, user, assistant are simple strings here.
  // For full_template, formatPromptForModel should be used.
  return (
    qwenProfile.chat_template.system.replace("{system_message}", sysMsg) +
    fullHistory +
    qwenProfile.chat_template.user.replace("{message}", prompt) +
    qwenProfile.chat_template.assistant.replace("{message}", "") // Start of assistant's turn
  );
};

interface ExtractedCommand {
  command: string | null;
  content: string;
  isThinking: boolean | null;
}

export const extractCommandFromInput = (
  userInput: string,
  profile: ModelProfile
): ExtractedCommand => {
  const trimmedInput = userInput.trim();

  if (profile.supports_thinking) {
    if (
      typeof profile.thinking_command === "string" &&
      trimmedInput.startsWith(profile.thinking_command)
    ) {
      return {
        command: profile.thinking_command,
        content: trimmedInput.substring(profile.thinking_command.length).trim(),
        isThinking: true,
      };
    }
    if (
      typeof profile.no_thinking_command === "string" &&
      trimmedInput.startsWith(profile.no_thinking_command)
    ) {
      return {
        command: profile.no_thinking_command,
        content: trimmedInput
          .substring(profile.no_thinking_command.length)
          .trim(),
        isThinking: false,
      };
    }
  }

  return {
    command: null,
    content: trimmedInput,
    isThinking: profile.supports_thinking ? null : false,
  };
};

// Helper to get current or default profile for utility functions if needed
// This is a placeholder, actual implementation might involve Redux store or direct service calls
export const getProfileForHelpers = async (
  profileId?: string
): Promise<ModelProfile> => {
  let profile: ModelProfile | null = null;
  if (profileId) {
    profile = await ModelProfileServiceInstance.getProfile(profileId);
    if (profile) return profile;
  }
  profile = await ModelProfileServiceInstance.getCurrentProfile();
  if (profile) return profile;

  // Fallback to a default profile if no current profile is found or if the specified one isn't found
  return DEFAULT_PROFILES[DEFAULT_QWEN_PROFILE.id] || DEFAULT_QWEN_PROFILE;
};

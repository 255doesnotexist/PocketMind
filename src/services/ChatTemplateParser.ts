import { ModelProfile, ChatTemplate } from '../config/modelProfiles';
import { Message } from '../features/chat/store/chatSlice';

export interface TemplateContext {
  system?: string;
  messages?: Message[];
  tools?: any[];
  prompt?: string;
  response?: string;
}

class ChatTemplateParser {
  /**
   * 解析简单模板（使用 {variable} 语法）
   */
  private parseSimpleTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return result;
  }

  /**
   * 为模型格式化聊天记录
   */
  formatChatHistory(
    profile: ModelProfile,
    messages: Message[],
    systemMessage?: string,
    tools?: any[]
  ): string {
    const template = profile.chat_template;
    
    // 如果有完整模板，优先使用（适用于复杂模型如 Qwen）
    if (template.full_template) {
      return this.parseFullTemplate(template.full_template, {
        system: systemMessage,
        messages,
        tools,
      });
    }

    // 使用简单模板
    let result = '';

    // 添加系统消息
    if (systemMessage && template.system) {
      result += this.parseSimpleTemplate(template.system, {
        system_message: systemMessage,
      });
    }

    // 添加消息历史
    for (const message of messages) {
      if (message.role === 'user' && template.user) {
        result += this.parseSimpleTemplate(template.user, {
          message: message.content,
        });
      } else if (message.role === 'assistant' && template.assistant) {
        result += this.parseSimpleTemplate(template.assistant, {
          message: message.content,
        });
      }
    }

    return result;
  }

  /**
   * 解析完整的 Go template（简化版实现）
   */
  private parseFullTemplate(template: string, context: TemplateContext): string {
    let result = template;
    
    // 处理系统消息
    if (context.system) {
      result = result.replace(/\{\{-?\s*\.System\s*\}\}/g, context.system);
      result = result.replace(/\{\{-?\s*if\s+\.System\s*\}\}([\s\S]*?)\{\{-?\s*end\s*\}\}/g, '$1');
    } else {
      result = result.replace(/\{\{-?\s*if\s+\.System\s*\}\}([\s\S]*?)\{\{-?\s*end\s*\}\}/g, '');
    }

    // 处理工具
    if (context.tools && context.tools.length > 0) {
      result = result.replace(/\{\{-?\s*\.Tools\s*\}\}/g, JSON.stringify(context.tools));
      result = result.replace(/\{\{-?\s*if\s+\.Tools\s*\}\}([\s\S]*?)\{\{-?\s*end\s*\}\}/g, '$1');
    } else {
      result = result.replace(/\{\{-?\s*if\s+\.Tools\s*\}\}([\s\S]*?)\{\{-?\s*end\s*\}\}/g, '');
    }

    // 处理消息
    if (context.messages) {
      const messagesSection = this.formatMessagesSection(result, context.messages);
      result = result.replace(/\{\{-?\s*if\s+\.Messages\s*\}\}([\s\S]*?)\{\{-?\s*else\s*\}\}([\s\S]*?)\{\{-?\s*end\s*\}\}/g, messagesSection);
    }

    // 清理模板语法
    result = this.cleanupTemplate(result);

    return result;
  }

  /**
   * 格式化消息部分
   */
  private formatMessagesSection(template: string, messages: Message[]): string {
    let result = '';
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const isLast = i === messages.length - 1;
      
      if (message.role === 'user') {
        result += `<|im_start|>user\n${message.content}<|im_end|>\n`;
      } else if (message.role === 'assistant') {
        result += `<|im_start|>assistant\n`;
        if (message.content) {
          result += message.content;
        }
        if (!isLast) {
          result += `<|im_end|>\n`;
        }
      }
    }

    // 如果最后一条不是助手消息，添加助手开始标签
    if (messages.length === 0 || messages[messages.length - 1].role !== 'assistant') {
      result += `<|im_start|>assistant\n`;
    }

    return result;
  }

  /**
   * 清理模板中剩余的语法
   */
  private cleanupTemplate(template: string): string {
    // 移除剩余的模板语法
    let result = template;
    
    // 移除条件语句
    result = result.replace(/\{\{-?\s*if\s+[^}]*\}\}/g, '');
    result = result.replace(/\{\{-?\s*else\s*\}\}/g, '');
    result = result.replace(/\{\{-?\s*end\s*\}\}/g, '');
    
    // 移除循环语句
    result = result.replace(/\{\{-?\s*range[^}]*\}\}/g, '');
    
    // 移除变量引用
    result = result.replace(/\{\{[^}]*\}\}/g, '');
    
    // 清理多余的空行
    result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return result.trim();
  }

  /**
   * 检测是否支持工具调用
   */
  supportsTools(profile: ModelProfile): boolean {
    return profile.supports_tools || false;
  }

  /**
   * 检测是否支持思考模式
   */
  supportsThinking(profile: ModelProfile): boolean {
    return profile.supports_thinking || false;
  }

  /**
   * 获取停止标记
   */
  getStopTokens(profile: ModelProfile, isThinking: boolean): string[] {
    const params = isThinking ? profile.params_thinking : profile.params_non_thinking;
    return params.stop || [];
  }
}

export default new ChatTemplateParser();

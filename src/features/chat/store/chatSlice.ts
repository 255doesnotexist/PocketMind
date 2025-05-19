import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageBase64?: string;
  thinkingContent?: string;
  pending?: boolean;
}

export interface ChatState {
  messages: Message[];
  currentThinkingContent: string | null;
  isThinkingModeActive: boolean;
  isGenerating: boolean;
  currentPrompt: string | null;
}

const initialState: ChatState = {
  messages: [],
  currentThinkingContent: null,
  isThinkingModeActive: false,
  isGenerating: false,
  currentPrompt: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    updateLastMessageChunk: (state, action: PayloadAction<string>) => {
      if (state.messages.length > 0) {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content += action.payload;
        }
      }
    },
    setThinkingContent: (state, action: PayloadAction<string | null>) => {
      state.currentThinkingContent = action.payload;
    },
    toggleThinkingMode: (state, action: PayloadAction<boolean | undefined>) => {
      state.isThinkingModeActive = action.payload !== undefined 
        ? action.payload 
        : !state.isThinkingModeActive;
    },
    setGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload;
    },
    setCurrentPrompt: (state, action: PayloadAction<string | null>) => {
      state.currentPrompt = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    markLastMessageAsDone: (state) => {
      if (state.messages.length > 0) {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage.pending) {
          lastMessage.pending = false;
        }
      }
    },
  },
});

export const { 
  addMessage, 
  updateLastMessageChunk, 
  setThinkingContent, 
  toggleThinkingMode,
  setGenerating,
  setCurrentPrompt,
  clearMessages,
  markLastMessageAsDone
} = chatSlice.actions;

export default chatSlice.reducer;

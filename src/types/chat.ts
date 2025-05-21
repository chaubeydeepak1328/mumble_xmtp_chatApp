export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  signature?: string;
  encrypted: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  participants: string[];
  createdAt: number;
  createdBy: string;
  isPrivate: boolean;
  lastMessageAt: number;
}

export interface User {
  address: string;
  displayName: string | null;
  avatar: string | null;
  status: 'online' | 'offline' | 'away';
  lastSeen: number;
}

export interface ChatState {
  channels: Channel[];
  currentChannelId: string | null;
  messages: Record<string, Message[]>;
  users: Record<string, User>;
  loading: {
    channels: boolean;
    messages: boolean;
    users: boolean;
  };
  error: string | null;
}

export interface ChatContextType extends ChatState {
  sendMessage: (channelId: string, content: string) => Promise<void>;
  createChannel: (name: string, description: string, isPrivate: boolean) => Promise<string>;
  joinChannel: (channelId: string) => Promise<void>;
  leaveChannel: (channelId: string) => Promise<void>;
  setCurrentChannel: (channelId: string | null) => void;
  fetchMessages: (channelId: string) => Promise<void>;
  updateUserProfile: (displayName: string, avatar: string) => Promise<void>;
}
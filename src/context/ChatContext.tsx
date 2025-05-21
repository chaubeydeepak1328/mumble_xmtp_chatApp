import { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatState, ChatContextType, Message, Channel, User } from '../types/chat';
import { useWalletContext } from './WalletContext';

// Initial state
const initialState: ChatState = {
  channels: [],
  currentChannelId: null,
  messages: {},
  users: {},
  loading: {
    channels: false,
    messages: false,
    users: false,
  },
  error: null,
};

// Action types
type ChatAction =
  | { type: 'SET_CHANNELS'; payload: Channel[] }
  | { type: 'SET_CURRENT_CHANNEL'; payload: string | null }
  | { type: 'SET_MESSAGES'; payload: { channelId: string; messages: Message[] } }
  | { type: 'ADD_MESSAGE'; payload: { channelId: string; message: Message } }
  | { type: 'SET_USERS'; payload: Record<string, User> }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: { key: keyof ChatState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CREATE_CHANNEL'; payload: Channel }
  | { type: 'JOIN_CHANNEL'; payload: { channelId: string; userAddress: string } }
  | { type: 'LEAVE_CHANNEL'; payload: { channelId: string; userAddress: string } };

// Reducer function
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_CHANNELS':
      return { ...state, channels: action.payload };
    case 'SET_CURRENT_CHANNEL':
      return { ...state, currentChannelId: action.payload };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.channelId]: action.payload.messages,
        },
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.channelId]: [
            ...(state.messages[action.payload.channelId] || []),
            action.payload.message,
          ],
        },
        channels: state.channels.map(channel => 
          channel.id === action.payload.channelId 
            ? { ...channel, lastMessageAt: action.payload.message.timestamp } 
            : channel
        )
      };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'ADD_USER':
      return {
        ...state,
        users: { ...state.users, [action.payload.address]: action.payload },
      };
    case 'UPDATE_USER':
      return {
        ...state,
        users: {
          ...state.users,
          [action.payload.address]: {
            ...state.users[action.payload.address],
            ...action.payload,
          },
        },
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value },
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CREATE_CHANNEL':
      return { ...state, channels: [...state.channels, action.payload] };
    case 'JOIN_CHANNEL':
      return {
        ...state,
        channels: state.channels.map(channel =>
          channel.id === action.payload.channelId
            ? {
                ...channel,
                participants: [...channel.participants, action.payload.userAddress],
              }
            : channel
        ),
      };
    case 'LEAVE_CHANNEL':
      return {
        ...state,
        channels: state.channels.map(channel =>
          channel.id === action.payload.channelId
            ? {
                ...channel,
                participants: channel.participants.filter(
                  p => p !== action.payload.userAddress
                ),
              }
            : channel
        ),
      };
    default:
      return state;
  }
};

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { address, connected } = useWalletContext();

  useEffect(() => {
    if (connected && address) {
      loadChannels();
    }
  }, [connected, address]);

  const loadChannels = async () => {
    if (!address) return;

    dispatch({ type: 'SET_LOADING', payload: { key: 'channels', value: true } });
    
    try {
      const { data: channels, error } = await supabase
        .from('channels')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      dispatch({ type: 'SET_CHANNELS', payload: channels });
    } catch (error) {
      console.error('Error loading channels:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load channels' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'channels', value: false } });
    }
  };

  const fetchMessages = async (channelId: string) => {
    if (!channelId) return;
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'messages', value: true } });
    
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      dispatch({
        type: 'SET_MESSAGES',
        payload: { channelId, messages },
      });

      // Subscribe to new messages
      subscribeToChannel(channelId, (payload) => {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { channelId, message: payload.new },
        });
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load messages' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'messages', value: false } });
    }
  };

  const sendMessage = async (channelId: string, content: string) => {
    if (!address || !channelId || !content.trim()) return;

    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          channel_id: channelId,
          sender: address,
          content: content.trim(),
          is_encrypted: false, // TODO: Implement encryption
        })
        .select()
        .single();

      if (error) throw error;

      // Update channel's last_message_at
      await supabase
        .from('channels')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', channelId);

    } catch (error) {
      console.error('Error sending message:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to send message' });
    }
  };

  const createChannel = async (name: string, description: string, isPrivate: boolean) => {
    if (!address) throw new Error('Wallet not connected');

    dispatch({ type: 'SET_LOADING', payload: { key: 'channels', value: true } });
    
    try {
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .insert({
          name,
          description,
          created_by: address,
          is_private: isPrivate,
        })
        .select()
        .single();

      if (channelError) throw channelError;

      // Add creator as participant
      const { error: participantError } = await supabase
        .from('channel_participants')
        .insert({
          channel_id: channel.id,
          user_address: address,
        });

      if (participantError) throw participantError;

      dispatch({ type: 'CREATE_CHANNEL', payload: channel });
      
      return channel.id;
    } catch (error) {
      console.error('Error creating channel:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create channel' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'channels', value: false } });
    }
  };

  const joinChannel = async (channelId: string) => {
    if (!address) throw new Error('Wallet not connected');

    try {
      // Simulate blockchain transaction delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Add user to channel participants
      dispatch({
        type: 'JOIN_CHANNEL',
        payload: { channelId, userAddress: address },
      });
    } catch (error) {
      console.error('Error joining channel:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to join channel. Please try again.' });
      throw error;
    }
  };

  const leaveChannel = async (channelId: string) => {
    if (!address) throw new Error('Wallet not connected');

    try {
      // Simulate blockchain transaction delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Remove user from channel participants
      dispatch({
        type: 'LEAVE_CHANNEL',
        payload: { channelId, userAddress: address },
      });

      // If current channel is being left, set to null
      if (state.currentChannelId === channelId) {
        dispatch({ type: 'SET_CURRENT_CHANNEL', payload: null });
      }
    } catch (error) {
      console.error('Error leaving channel:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to leave channel. Please try again.' });
      throw error;
    }
  };

  const setCurrentChannel = (channelId: string | null) => {
    dispatch({ type: 'SET_CURRENT_CHANNEL', payload: channelId });
    if (channelId) {
      fetchMessages(channelId);
    }
  };

  const updateUserProfile = async (displayName: string, avatar: string) => {
    if (!address) throw new Error('Wallet not connected');

    try {
      // Simulate blockchain transaction delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update user profile
      dispatch({
        type: 'UPDATE_USER',
        payload: {
          address,
          displayName,
          avatar,
          status: 'online',
          lastSeen: Date.now(),
        },
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update profile. Please try again.' });
      throw error;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        ...state,
        sendMessage,
        createChannel,
        joinChannel,
        leaveChannel,
        setCurrentChannel,
        fetchMessages,
        updateUserProfile,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
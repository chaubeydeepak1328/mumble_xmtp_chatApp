import { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { ChatState, ChatContextType, Message, Channel, User } from '../types/chat';
import { useWalletContext } from './WalletContext';

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
                ),
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

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(chatReducer, initialState);
    const { address, connected } = useWalletContext();

    useEffect(() => {
        if (connected && address) {
            dispatch({ type: 'SET_CHANNELS', payload: [] }); // could prefill
        }
    }, [connected, address]);

    const fetchMessages = async (channelId: string) => {
        // In a real XMTP-powered app, this would be handled via XMTP SDK
        dispatch({ type: 'SET_LOADING', payload: { key: 'messages', value: true } });
        dispatch({ type: 'SET_MESSAGES', payload: { channelId, messages: [] } });
        dispatch({ type: 'SET_LOADING', payload: { key: 'messages', value: false } });
    };

    const sendMessage = async (channelId: string, content: string) => {
        if (!address || !channelId || !content.trim()) return;

        const message: Message = {
            id: `${Date.now()}`,
            sender: address,
            content: content.trim(),
            timestamp: Date.now(),
            encrypted: true,
        };

        dispatch({ type: 'ADD_MESSAGE', payload: { channelId, message } });
    };

    const createChannel = async (name: string, description: string, isPrivate: boolean) => {
        if (!address) throw new Error('Wallet not connected');

        const newChannel: Channel = {
            id: `${Date.now()}`,
            name,
            description,
            isPrivate,
            createdBy: address,
            participants: [address],
            lastMessageAt: Date.now(),
        };

        dispatch({ type: 'CREATE_CHANNEL', payload: newChannel });
        return newChannel.id;
    };

    const joinChannel = async (channelId: string) => {
        if (!address) throw new Error('Wallet not connected');

        dispatch({
            type: 'JOIN_CHANNEL',
            payload: { channelId, userAddress: address },
        });
    };

    const leaveChannel = async (channelId: string) => {
        if (!address) throw new Error('Wallet not connected');

        dispatch({
            type: 'LEAVE_CHANNEL',
            payload: { channelId, userAddress: address },
        });

        if (state.currentChannelId === channelId) {
            dispatch({ type: 'SET_CURRENT_CHANNEL', payload: null });
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

import { useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useWallet } from '../../hooks/useWallet';
import ChatMessage from './ChatMessage';
import { MessageCircle } from 'lucide-react';

interface ChatListProps {
  channelId: string;
}

const ChatList = ({ channelId }: ChatListProps) => {
  const { messages, loading } = useChat();
  const { address } = useWallet();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelMessages = messages[channelId] || [];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages]);

  if (loading.messages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (channelMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
          <MessageCircle size={32} />
        </div>
        <h3 className="text-xl font-medium mb-2">No messages yet</h3>
        <p className="text-center text-muted-foreground max-w-md">
          Be the first to send a message in this channel. All messages are end-to-end encrypted and stored on the Ramestta blockchain.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {channelMessages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          isOwn={message.sender === address}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatList;
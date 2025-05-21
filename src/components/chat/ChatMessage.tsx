import { useMemo } from 'react';
import { formatDistanceToNow } from '../../utils/formatters';
import { Message } from '../../types/chat';
import { useChat } from '../../hooks/useChat';
import { User, Lock } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
}

const ChatMessage = ({ message, isOwn }: ChatMessageProps) => {
  const { users } = useChat();
  
  const sender = useMemo(() => {
    if (isOwn) return users[message.sender] || { displayName: 'You', address: message.sender };
    return users[message.sender] || { displayName: 'Unknown User', address: message.sender };
  }, [isOwn, message.sender, users]);

  const senderDisplayName = sender.displayName || `${sender.address.slice(0, 6)}...${sender.address.slice(-4)}`;
  const timeAgo = formatDistanceToNow(message.timestamp);

  return (
    <div className={`mb-4 max-w-[85%] ${isOwn ? 'ml-auto' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        {!isOwn && (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            {sender.avatar ? (
              <img src={sender.avatar} alt={senderDisplayName} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <User size={16} />
            )}
          </div>
        )}
        <div className={`flex items-center gap-2 ${isOwn ? 'ml-auto' : ''}`}>
          <span className={`text-sm font-medium ${isOwn ? 'text-primary' : ''}`}>{senderDisplayName}</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {message.encrypted && (
            <Lock size={12} className="text-secondary" title="End-to-end encrypted" />
          )}
        </div>
      </div>
      <div
        className={`rounded-lg p-3 ${
          isOwn
            ? 'bg-primary text-white rounded-tr-none'
            : 'bg-muted text-foreground rounded-tl-none'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import ChatList from '../components/chat/ChatList';
import ChatInput from '../components/chat/ChatInput';
import { MessageCircle } from 'lucide-react';

const Chat = () => {
  const { channelId } = useParams<{ channelId?: string }>();
  const { channels, currentChannelId, setCurrentChannel, loading } = useChat();

  useEffect(() => {
    if (channelId && channelId !== currentChannelId) {
      setCurrentChannel(channelId);
    } else if (!channelId && channels.length > 0 && !currentChannelId) {
      setCurrentChannel(channels[0].id);
    }
  }, [channelId, channels, currentChannelId, setCurrentChannel]);

  // Find the current channel
  const currentChannel = channels.find(channel => channel.id === currentChannelId);

  // If no channel is selected and channels are loading
  if (loading.channels) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no channel is selected and no channels exist
  if (!currentChannelId || !currentChannel) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
          <MessageCircle size={32} />
        </div>
        <h3 className="text-xl font-medium mb-2">No channel selected</h3>
        <p className="text-center text-muted-foreground max-w-md mb-4">
          Select a channel from the sidebar or create a new one to start chatting.
        </p>
        {channels.length === 0 && (
          <p className="text-center text-muted-foreground">
            You haven't joined any channels yet.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Channel header */}
      <div className="px-4 py-3 border-b border-border bg-input">
        <div className="flex items-start">
          <div>
            <h2 className="text-lg font-medium flex items-center">
              {currentChannel.name}
              {currentChannel.isPrivate && (
                <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  Private
                </span>
              )}
            </h2>
            {currentChannel.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {currentChannel.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <ChatList channelId={currentChannelId} />

      {/* Chat input */}
      <ChatInput channelId={currentChannelId} />
    </div>
  );
};

export default Chat;
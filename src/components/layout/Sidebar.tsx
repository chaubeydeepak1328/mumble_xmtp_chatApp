import { useChat } from '../../hooks/useChat';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Plus, MessageCircle, Hash, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import NewChannelModal from '../modals/NewChannelModal';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  const { channels, currentChannelId, setCurrentChannel, loading } = useChat();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectChannel = (channelId: string) => {
    setCurrentChannel(channelId);
    navigate(`/chat/${channelId}`);
  };

  if (!isOpen) {
    return (
      <div className="w-10 bg-input border-r border-border flex flex-col items-center py-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-muted/30 text-muted-foreground mb-4"
          aria-label="Open sidebar"
        >
          <ChevronRight size={16} />
        </button>
        {channels.slice(0, 5).map((channel) => (
          <button
            key={channel.id}
            onClick={() => handleSelectChannel(channel.id)}
            className={`p-2 mb-1 rounded-md hover:bg-muted/30 ${
              currentChannelId === channel.id ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            }`}
            title={channel.name}
          >
            {channel.isPrivate ? (
              <Lock size={16} />
            ) : (
              <Hash size={16} />
            )}
          </button>
        ))}
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 rounded-md hover:bg-muted/30 text-muted-foreground mt-2"
          title="New Channel"
        >
          <Plus size={16} />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-64 bg-input border-r border-border overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">Channels</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 rounded-md hover:bg-muted/30 text-muted-foreground"
              aria-label="New Channel"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-md hover:bg-muted/30 text-muted-foreground"
              aria-label="Close sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 py-2">
          {loading.channels ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary"></div>
            </div>
          ) : channels.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              <p className="mb-2">No channels yet</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-outline text-xs py-1 px-2"
              >
                Create a channel
              </button>
            </div>
          ) : (
            <ul className="space-y-1 px-2">
              {channels.map((channel) => (
                <li key={channel.id}>
                  <button
                    onClick={() => handleSelectChannel(channel.id)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                      currentChannelId === channel.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted/30 text-foreground'
                    }`}
                  >
                    {channel.isPrivate ? (
                      <Lock size={16} className="flex-shrink-0" />
                    ) : (
                      <Hash size={16} className="flex-shrink-0" />
                    )}
                    <span className="truncate">{channel.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-primary" />
            <span className="text-sm font-medium">MumbleChat</span>
            <span className="ml-auto text-xs text-muted-foreground">v0.1.0</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Decentralized messaging on Ramestta</p>
        </div>
      </div>

      <NewChannelModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Sidebar;
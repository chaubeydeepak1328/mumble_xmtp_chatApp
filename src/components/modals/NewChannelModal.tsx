import { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { useNavigate } from 'react-router-dom';
import { X, Hash, Lock } from 'lucide-react';

interface NewChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewChannelModal = ({ isOpen, onClose }: NewChannelModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { createChannel, setCurrentChannel } = useChat();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Channel name is required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const channelId = await createChannel(name.trim(), description.trim(), isPrivate);
      setCurrentChannel(channelId);
      navigate(`/chat/${channelId}`);
      
      onClose();
      // Reset form
      setName('');
      setDescription('');
      setIsPrivate(false);
    } catch (error) {
      setError('Failed to create channel. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-input border border-border rounded-lg shadow-lg slide-up">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-medium">Create a new channel</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="channel-name" className="block text-sm font-medium mb-1">
              Channel name
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {isPrivate ? <Lock size={16} /> : <Hash size={16} />}
              </div>
              <input
                id="channel-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input pl-10"
                placeholder="e.g. general-discussion"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="channel-description" className="block text-sm font-medium mb-1">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="channel-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="What is this channel about?"
              disabled={isLoading}
            />
          </div>
          
          <div className="mb-6">
            <div className="flex items-center">
              <input
                id="is-private"
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary/20 border-border rounded"
                disabled={isLoading}
              />
              <label htmlFor="is-private" className="ml-2 block text-sm">
                Make channel private
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-6">
              Private channels are only visible to invited members
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded text-sm text-error">
              {error}
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Channel'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewChannelModal;
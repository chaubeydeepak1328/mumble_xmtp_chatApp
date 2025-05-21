// import { useState, FormEvent, KeyboardEvent, useRef, useEffect } from 'react';
// import { useChat } from '../../hooks/useChat';
// import { Send, Lock } from 'lucide-react';

// interface ChatInputProps {
//   channelId: string;
// }

// const ChatInput = ({ channelId }: ChatInputProps) => {
//   const [message, setMessage] = useState('');
//   const [isSending, setIsSending] = useState(false);
//   const { sendMessage } = useChat();
//   const textareaRef = useRef<HTMLTextAreaElement>(null);

//   useEffect(() => {
//     if (textareaRef.current) {
//       textareaRef.current.style.height = 'auto';
//       textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
//     }
//   }, [message]);

//   const handleSendMessage = async (e: FormEvent) => {
//     e.preventDefault();

//     if (!message.trim() || isSending) return;

//     try {
//       setIsSending(true);
//       await sendMessage(channelId, message);
//       setMessage('');

//       // Reset textarea height
//       if (textareaRef.current) {
//         textareaRef.current.style.height = 'auto';
//       }
//     } catch (error) {
//       console.error('Error sending message:', error);
//     } finally {
//       setIsSending(false);
//     }
//   };

//   const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage(e);
//     }
//   };

//   return (
//     <form
//       onSubmit={handleSendMessage}
//       className="border-t border-border bg-input py-3 px-4"
//     >
//       <div className="flex items-end gap-2">
//         <div className="flex-1 relative">
//           <textarea
//             ref={textareaRef}
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             onKeyDown={handleKeyDown}
//             placeholder="Write a message..."
//             className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-32"
//             disabled={isSending}
//             rows={1}
//           />
//           <div className="absolute right-3 bottom-2 flex items-center gap-1 text-xs text-muted-foreground">
//             <Lock size={12} />
//             <span>End-to-end encrypted</span>
//           </div>
//         </div>
//         <button
//           type="submit"
//           className="flex-shrink-0 h-10 w-10 rounded-md bg-primary text-white flex items-center justify-center hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
//           disabled={!message.trim() || isSending}
//         >
//           {isSending ? (
//             <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
//           ) : (
//             <Send size={18} />
//           )}
//         </button>
//       </div>
//     </form>
//   );
// };

// export default ChatInput;

import { useState, FormEvent, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Lock } from 'lucide-react';
import { Client, Conversation } from '@xmtp/xmtp-js';
import { ethers } from 'ethers';

interface ChatInputProps {
  channelId: string; // treated as recipient wallet address
}

const ChatInput = ({ channelId }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [xmtp, setXmtp] = useState<Client | null>(null);
  const [charCount, setCharCount] = useState<number>(0);



  // Load XMTP & signer
  useEffect(() => {
    const initXmtp = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const client = await Client.create(signer, { env: 'production' });
        const convo = await client.conversations.newConversation(channelId);

        setXmtp(client);
        setConversation(convo);
      } catch (err) {
        console.error('XMTP init failed:', err);
      }
    };

    initXmtp();
  }, [channelId]);

  // Load/reset daily char count from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = JSON.parse(localStorage.getItem('mmct-chat-count') || '{}');

    if (stored.date !== today) {
      localStorage.setItem('mmct-chat-count', JSON.stringify({ date: today, count: 0 }));
      setCharCount(0);
    } else {
      setCharCount(stored.count || 0);
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Send Message
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending || !conversation) return;

    const newCharCount = charCount + message.length;
    if (newCharCount > 50000) {
      alert('❗ You’ve reached the 50,000 character limit. Please recharge with MMCT.');
      return;
    }

    try {
      setIsSending(true);
      await conversation.send(message);
      setMessage('');
      setCharCount(newCharCount);
      localStorage.setItem(
        'mmct-chat-count',
        JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          count: newCharCount,
        })
      );

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <form
      onSubmit={handleSendMessage}
      className="border-t border-border bg-input py-3 px-4"
    >
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-32"
            disabled={isSending}
            rows={1}
          />
          <div className="absolute right-3 bottom-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Lock size={12} />
            <span>End-to-end encrypted</span>
          </div>
        </div>
        <button
          type="submit"
          className="flex-shrink-0 h-10 w-10 rounded-md bg-primary text-white flex items-center justify-center hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          disabled={!message.trim() || isSending}
        >
          {isSending ? (
            <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </form>
  );
};

export default ChatInput;

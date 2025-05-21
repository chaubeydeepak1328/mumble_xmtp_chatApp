// import { useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import { useChat } from '../hooks/useChat';
// import ChatList from '../components/chat/ChatList';
// import ChatInput from '../components/chat/ChatInput';
// import { MessageCircle } from 'lucide-react';

// const Chat = () => {
//   const { channelId } = useParams<{ channelId?: string }>();
//   const { channels, currentChannelId, setCurrentChannel, loading } = useChat();

//   useEffect(() => {
//     if (channelId && channelId !== currentChannelId) {
//       setCurrentChannel(channelId);
//     } else if (!channelId && channels.length > 0 && !currentChannelId) {
//       setCurrentChannel(channels[0].id);
//     }
//   }, [channelId, channels, currentChannelId, setCurrentChannel]);

//   // Find the current channel
//   const currentChannel = channels.find(channel => channel.id === currentChannelId);

//   // If no channel is selected and channels are loading
//   if (loading.channels) {
//     return (
//       <div className="h-full flex items-center justify-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   // If no channel is selected and no channels exist
//   if (!currentChannelId || !currentChannel) {
//     return (
//       <div className="h-full flex flex-col items-center justify-center p-8">
//         <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
//           <MessageCircle size={32} />
//         </div>
//         <h3 className="text-xl font-medium mb-2">No channel selected</h3>
//         <p className="text-center text-muted-foreground max-w-md mb-4">
//           Select a channel from the sidebar or create a new one to start chatting.
//         </p>
//         {channels.length === 0 && (
//           <p className="text-center text-muted-foreground">
//             You haven't joined any channels yet.
//           </p>
//         )}
//       </div>
//     );
//   }

//   return (
//     <div className="h-full flex flex-col">
//       {/* Channel header */}
//       <div className="px-4 py-3 border-b border-border bg-input">
//         <div className="flex items-start">
//           <div>
//             <h2 className="text-lg font-medium flex items-center">
//               {currentChannel.name}
//               {currentChannel.isPrivate && (
//                 <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
//                   Private
//                 </span>
//               )}
//             </h2>
//             {currentChannel.description && (
//               <p className="text-sm text-muted-foreground mt-1">
//                 {currentChannel.description}
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Chat messages */}
//       <ChatList channelId={currentChannelId} />

//       {/* Chat input */}
//       <ChatInput channelId={currentChannelId} />
//     </div>
//   );
// };

// export default Chat;


import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

import { useChat } from '../hooks/useChat';
import ChatList from '../components/chat/ChatList';
import ChatInput from '../components/chat/ChatInput';

import { Client, Conversation, DecodedMessage } from '@xmtp/xmtp-js';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface XMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  encrypted: boolean;
}

const Chat = () => {
  const { channelId } = useParams<{ channelId?: string }>();
  const { channels, currentChannelId, setCurrentChannel, loading } = useChat();

  const [xmtp, setXmtp] = useState<Client | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<XMessage[]>([]);
  const [charCount, setCharCount] = useState(0);

  const getSigner = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      return provider.getSigner();
    }
    throw new Error("MetaMask not installed");
  };

  useEffect(() => {
    const initXmtp = async () => {
      try {
        const signer = await getSigner();
        const client = await Client.create(signer, { env: 'production' });
        setXmtp(client);
      } catch (error) {
        console.error("XMTP init failed:", error);
      }
    };
    initXmtp();
  }, []);

  useEffect(() => {
    if (channelId && channelId !== currentChannelId) {
      setCurrentChannel(channelId);
    } else if (!channelId && channels.length > 0 && !currentChannelId) {
      setCurrentChannel(channels[0].id);
    }
  }, [channelId, channels, currentChannelId, setCurrentChannel]);

  const loadConversation = useCallback(async () => {
    if (!xmtp || !currentChannelId) return;

    const convo = await xmtp.conversations.newConversation(currentChannelId);
    const msgs = await convo.messages();
    setConversation(convo);

    const mapped: XMessage[] = msgs.map((m, i) => ({
      id: i.toString(),
      sender: m.senderAddress,
      content: m.content,
      timestamp: m.sent.getTime(),
      encrypted: true,
    }));

    setMessages(mapped);
    setCharCount(mapped.reduce((sum, m) => sum + m.content.length, 0));
  }, [xmtp, currentChannelId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  const handleSendMessage = async (text: string) => {
    if (!conversation) return;
    if (charCount + text.length > 50000) {
      alert("You've exceeded 50,000 characters for the day. Please recharge using MMCT.");
      return;
    }

    try {
      await conversation.send(text);
      const sender = await getSigner();
      const newMsg: XMessage = {
        id: Date.now().toString(),
        sender: await sender.getAddress(),
        content: text,
        timestamp: Date.now(),
        encrypted: true,
      };

      setMessages((prev) => [...prev, newMsg]);
      setCharCount((prev) => prev + text.length);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const currentChannel = channels.find(c => c.id === currentChannelId);

  if (loading.channels) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

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
      {/* Header */}
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

      {/* XMTP ChatList and Input */}
      <ChatList channelId={currentChannelId} />
      <ChatInput channelId={currentChannelId} />
    </div>
  );
};

export default Chat;

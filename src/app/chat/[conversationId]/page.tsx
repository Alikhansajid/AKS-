'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import Pusher from 'pusher-js';

// Define message type based on Prisma schema + extra isMine field
type Message = {
  id: number;
  publicId: string;
  conversationId: number;
  senderId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  isMine: boolean;
};

type ConversationResponse = {
  messages: Message[];
  user: {
    id: number;
    publicId: string;
    name: string;
    role: string;
  };
};

async function fetcher(url: string): Promise<ConversationResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default function ChatBox() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { data, error } = useSWR(`/api/chat/${conversationId}`, fetcher);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!data?.user) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`conversation-${conversationId}`);

    channel.bind('new-message', () => {
      mutate(`/api/chat/${conversationId}`);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`conversation-${conversationId}`);
      pusher.disconnect();
    };
  }, [conversationId, data?.user]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await fetch(`/api/chat/${conversationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newMessage }),
    });
    setNewMessage('');
  };

  if (error) return <div className="p-6">Failed to load chat</div>;
  if (!data) return <div className="p-6">Loading chat...</div>;

  return (
    <div className="flex flex-col h-[80vh] p-6">
      <div className="flex-1 overflow-y-auto space-y-3 border border-zinc-700 p-3 rounded-lg">
        {data.messages.map((msg) => (
          <div key={msg.id} className={msg.isMine ? 'text-right' : 'text-left'}>
            <span
              className={`inline-block px-3 py-2 rounded-lg ${
                msg.isMine
                  ? 'bg-amber-500 text-black'
                  : 'bg-zinc-700 text-white'
              }`}
            >
              {msg.content}
            </span>
          </div>
        ))}
      </div>
      <div className="flex mt-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 border border-zinc-700 rounded-lg px-3 py-2 bg-zinc-800 text-white"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="ml-3 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
}

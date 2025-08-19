'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import Pusher from 'pusher-js';
import { toast } from 'react-toastify';
import type { Message, Conversation } from '@/types/chat';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ConversationResponse {
  conversation: Conversation;
  messages: Message[];
}

export default function AdminConversationPage() {
  const params = useParams();
  const conversationId = params?.conversationId as string | undefined;

  const { data, error } = useSWR<ConversationResponse>(
    conversationId ? `/api/chat/${conversationId}` : null,
    fetcher
  );

  const [text, setText] = useState('');

  useEffect(() => {
    if (!conversationId) return;

    const p = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const ch = p.subscribe(`conversation-${conversationId}`);
    ch.bind('new-message', () => {
      mutate(`/api/chat/${conversationId}`);
    });

    return () => {
      ch.unbind_all();
      p.unsubscribe(`conversation-${conversationId}`);
      p.disconnect();
    };
  }, [conversationId]);

  async function send() {
    if (!text.trim() || !conversationId) return;

    const res = await fetch(`/api/chat/${conversationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    });

    if (!res.ok) {
      toast.error('Failed to send');
      return;
    }

    setText('');
    toast.success('Sent');
  }

  if (!conversationId) return <div className="p-6">Invalid conversation</div>;
  if (error) return <div className="p-6">Failed to load</div>;
  if (!data) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 h-[80vh] flex flex-col">
      <div className="text-xl font-semibold mb-3">
        Conversation {conversationId}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto border rounded p-3 space-y-2 bg-white">
        {data.messages?.length ? (
          data.messages.map((m) => {
            const admin = m.sender.role === 'ADMIN';
            return (
              <div
                key={m.publicId}
                className={`max-w-[70%] px-3 py-2 rounded-lg ${
                  admin ? 'bg-amber-100 self-end ml-auto' : 'bg-zinc-200'
                }`}
              >
                {m.content}
              </div>
            );
          })
        ) : (
          <div className="text-zinc-500 text-sm">No messages yet</div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={send}
          className="px-4 py-2 bg-amber-500 text-black rounded font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
}

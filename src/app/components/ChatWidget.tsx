'use client';

import { useEffect, useState } from 'react';
import useSWR, { mutate } from 'swr';
import Pusher from 'pusher-js';
import { toast } from 'react-toastify';

type Sender = { publicId: string; name: string; role: 'ADMIN' | 'CUSTOMER' | 'RIDER' };
type Message = {
  publicId: string;
  content: string;
  createdAt: string;
  sender: Sender;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { data, error } = useSWR<{ conversationPublicId: string; messages: Message[] }>(
    open ? '/api/chat/customer' : null,
    fetcher
  );
  const [text, setText] = useState('');

  useEffect(() => {
    if (!data?.conversationPublicId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`conversation-${data.conversationPublicId}`);

    channel.bind('new-message', () => {
      mutate('/api/chat/customer');
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`conversation-${data.conversationPublicId}`);
      pusher.disconnect();
    };
  }, [data?.conversationPublicId, open]);

  async function send() {
    if (!text.trim()) return;
    const res = await fetch('/api/chat/customer', {
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

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded-full shadow-lg bg-amber-500 text-black font-semibold hover:bg-amber-400"
        >
          Chat
        </button>
      )}

      {open && (
        <div className="w-80 h-96 bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
          <div className="bg-amber-500 text-black font-semibold p-3 flex justify-between">
            <span>Support</span>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {error && <div className="text-sm text-red-500">Failed to load chat</div>}
            {!data && <div className="text-sm text-zinc-500">Loading…</div>}
            {data?.messages?.map((m) => {
              const mine = m.sender.role !== 'ADMIN';
              return (
                <div
                  key={m.publicId}
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    mine ? 'bg-amber-100 ml-auto' : 'bg-zinc-200'
                  }`}
                >
                  {m.content}
                </div>
              );
            })}
          </div>

          <div className="p-2 border-t flex gap-2 bg-white">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 border rounded-md px-3 py-2 text-sm"
              placeholder="Enter your message…"
            />
            <button
              onClick={send}
              className="px-3 py-2 rounded-md bg-amber-500 text-black font-semibold hover:bg-amber-400"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

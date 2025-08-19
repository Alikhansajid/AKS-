'use client';

import { useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import Pusher from 'pusher-js';
import type { Conversation } from '@/types/chat';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminChatListPage() {
  const { data, error } = useSWR<Conversation[]>('/api/chat', fetcher);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('admin-conversations');

    channel.bind('new-message', () => {
      mutate('/api/chat'); 
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('admin-conversations');
      pusher.disconnect();
    };
  }, []);

  if (error) return <div className="p-6">Failed to load</div>;
  if (!data) return <div className="p-6">Loading…</div>;

  return (
    <div className="grid grid-cols-3 h-[80vh]">
     
      <div className="col-span-1 border-r p-4 space-y-2 overflow-y-auto">
        {data.map((c) => {
          const customer = c.participants.find((p) => p.user.role === 'CUSTOMER');
          const lastMessage = c.messages?.[0]; 

          return (
            <div key={c.publicId}>
              <Link href={`/admin/chat/${c.publicId}`}>
                <div className="p-3 border rounded hover:bg-zinc-100">
                  <div className="font-semibold">
                    {customer?.user.name || 'Unknown Customer'}
                  </div>
                  <div className="text-sm text-zinc-500 truncate">
                    {lastMessage ? lastMessage.sender.name + ': …' : 'No messages yet'}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      <div className="col-span-2 flex items-center justify-center text-zinc-500">
        Select a conversation
      </div>
    </div>
  );
}

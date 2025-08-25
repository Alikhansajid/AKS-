"use client";

import { useEffect, useState, useRef, memo } from "react";
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import { socket } from "@/lib/socket";
import { useSession } from "@/lib/hooks/useSession";
import { format } from "date-fns";
import { Role } from "@/types/enums";
import Image from "next/image";
import { debounce } from "lodash";
import toast from "react-hot-toast";

// --- fetcher helper ---
const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((res) => res.json());

// --- types ---
interface User {
  publicId: string;
  name: string;
  role: Role;
  profilePic?: string;
}

interface Message {
  publicId: string;
  conversationPublicId: string;
  sender: User;
  content: string;
  createdAt: string;
}

interface Conversation {
  publicId: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

// --- memoized message component ---
const MessageBubble = memo(({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) => {
  const formatTime = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return format(d, "HH:mm");
  };

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-3 py-2 rounded-lg max-w-xs ${
          isOwnMessage ? "bg-amber-500 text-black" : "bg-zinc-800 text-white"
        }`}
      >
        <p>{message.content}</p>
        <span className="text-xs opacity-70">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
});
MessageBubble.displayName = "MessageBubble";

export default function ChatPage() {
  const { user: me } = useSession();

  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  // const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debounced search handlers
  const debouncedSetSearchTerm = debounce((value: string) => setSearchTerm(value), 300);
  const debouncedSetUserSearch = debounce((value: string) => setUserSearch(value), 300);

  // Fetch conversations
  const {
    data: conversations,
    mutate: mutateConversations,
  } = useSWR<Conversation[]>("/api/conversations", fetcher);

  // Fetch messages for active conversation
  const {
    data: messages,
    mutate: mutateMessages,
  } = useSWR<Message[]>(
    activeConversation ? `/api/conversations/${activeConversation}/messages` : null,
    fetcher
  );

  // Fetch all users for admin to start new chats
  const { data: rawUsers } = useSWR("/api/admin/users", fetcher);
  const users: User[] = Array.isArray(rawUsers) ? rawUsers : rawUsers?.users || [];

  // Send message mutation
  const { trigger: sendMessage } = useSWRMutation(
    activeConversation ? `/api/conversations/${activeConversation}/messages` : null,
    async (url, { arg }: { arg: { content: string; senderPublicId: string } }) => {
      const res = await mutate(url, async () => {
        const response = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(arg),
        });
        if (!response.ok) throw new Error("Failed to send message");
        return response.json();
      }, { revalidate: false });
      return res;
    }
  );

  // Start new conversation mutation
  const { trigger: startNewConversation } = useSWRMutation(
    "/api/conversations",
    async (url, { arg }: { arg: { participantPublicId: string } }) => {
      const res = await mutate(url, async () => {
        const response = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(arg),
        });
        if (!response.ok) throw new Error("Failed to start conversation");
        return response.json();
      }, { revalidate: false });
      return res;
    }
  );

  // Initialize Socket.IO connection
  useEffect(() => {
    // Trigger Socket.IO server initialization
    fetch("/api/socket/io", { method: "GET", credentials: "include" })
      .then(() => console.log("🔌 Socket.IO server initialization triggered"))
      .catch((err) => console.error("Failed to initialize Socket.IO server:", err));

    socket.on("connect", () => setIsSocketConnected(true));
    socket.on("disconnect", () => setIsSocketConnected(false));

    // Join user room
    if (me?.publicId) {
      socket.emit("join", { publicId: me.publicId });
    }

    // Listener 1: Messages for ACTIVE chat
    socket.on("message:active", (msg: Message) => {
      if (activeConversation === msg.conversationPublicId) {
        mutateMessages((old = []) => {
          if (old.some((m) => m.publicId === msg.publicId)) return old;
          return [...old, msg];
        }, false);
      }
    });

    // Listener 2: Messages for sidebar
    socket.on("message:sidebar", (msg: Message) => {
      mutateConversations((old = []) => {
        const exists = old.find((c) => c.publicId === msg.conversationPublicId);

        if (exists) {
          return [
            {
              ...exists,
              lastMessage: msg,
              unreadCount:
                activeConversation === msg.conversationPublicId
                  ? 0
                  : exists.unreadCount + 1,
              updatedAt: msg.createdAt,
            },
            ...old
              .filter((c) => c.publicId !== msg.conversationPublicId)
              .sort(
                (a, b) =>
                  new Date(b.lastMessage?.createdAt || b.updatedAt).getTime() -
                  new Date(a.lastMessage?.createdAt || a.updatedAt).getTime()
              ),
          ];
        }

        return [
          {
            publicId: msg.conversationPublicId,
            participants: [msg.sender],
            lastMessage: msg,
            unreadCount: activeConversation === msg.conversationPublicId ? 0 : 1,
            updatedAt: msg.createdAt,
          },
          ...old,
        ];
      }, false);
    });

    // Listener 3: New conversations
    socket.on("conversation:new", (conv: Conversation) => {
      mutateConversations((old = []) => {
        if (old.some((c) => c.publicId === conv.publicId)) return old;
        return [conv, ...old];
      }, false);
    });

    // Listener 4: Typing events
    // socket.on("typing", (data: { conversationId: string; userId: string; userName: string }) => {
    //   if (data.conversationId === activeConversation && data.userId !== me?.publicId) {
    //     setTypingUsers((prev) => {
    //       if (!prev.includes(data.userId)) return [...prev, data.userId];
    //       return prev;
    //     });
    //     setTimeout(() => {
    //       setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
    //     }, 3000);
    //   }
    // });

    // Cleanup
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("message:active");
      socket.off("message:sidebar");
      socket.off("conversation:new");
      // socket.off("typing");
    };
  }, [activeConversation, me?.publicId, mutateConversations, mutateMessages]);

  // Join conversation room for typing events
  useEffect(() => {
    if (activeConversation && me?.publicId) {
      socket.emit("join", { conversationId: activeConversation });
    }
    return () => {
      if (activeConversation) {
        socket.emit("leave", { conversationId: activeConversation });
      }
    };
  }, [activeConversation, me?.publicId]);

  // Emit typing event
  // const handleTyping = () => {
  //   if (activeConversation && me?.publicId) {
  //     socket.emit("typing", {
  //       conversationId: activeConversation,
  //       userId: me.publicId,
  //       userName: me.name,
  //     });
  //   }
  // };

  async function startConversation(userPublicId: string) {
    try {
      const conv: Conversation = await startNewConversation({
        participantPublicId: userPublicId,
      });
      await mutateConversations();
      setActiveConversation(conv.publicId);
      setShowNewChat(false);
    } catch (err) {
      console.error("Failed to start conversation", err);
      toast.error("Failed to start conversation");
    }
  }

  // Send message handler
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !me || !activeConversation) return;

    const tempMessage: Message = {
      publicId: `temp-${Date.now()}`,
      conversationPublicId: activeConversation,
      sender: me,
      content: newMessage,
      createdAt: new Date().toISOString(),
    };

    mutateMessages((old = []) => [...old, tempMessage], false);
    mutateConversations((old = []) => {
      const exists = old.find((c) => c.publicId === activeConversation);
      if (exists) {
        return [
          {
            ...exists,
            lastMessage: tempMessage,
            updatedAt: tempMessage.createdAt,
          },
          ...old
            .filter((c) => c.publicId !== activeConversation)
            .sort(
              (a, b) =>
                new Date(b.lastMessage?.createdAt || b.updatedAt).getTime() -
                new Date(a.lastMessage?.createdAt || a.updatedAt).getTime()
            ),
        ];
      }
      return old;
    }, false);
    setNewMessage("");

    try {
      const saved: Message = await sendMessage({
        content: tempMessage.content,
        senderPublicId: me.publicId,
      });

      mutateMessages((old = []) =>
        old.map((m) => (m.publicId === tempMessage.publicId ? saved : m))
      );
      mutateConversations((old = []) => {
        const exists = old.find((c) => c.publicId === activeConversation);
        if (exists) {
          return [
            {
              ...exists,
              lastMessage: saved,
              updatedAt: saved.createdAt,
            },
            ...old
              .filter((c) => c.publicId !== activeConversation)
              .sort(
                (a, b) =>
                  new Date(b.lastMessage?.createdAt || b.updatedAt).getTime() -
                  new Date(a.lastMessage?.createdAt || a.updatedAt).getTime()
              ),
          ];
        }
        return old;
      }, false);
    } catch (e) {
      console.error("Failed to send message:", e);
      mutateMessages((old = []) =>
        old.filter((m) => m.publicId !== tempMessage.publicId)
      );
      mutateConversations((old = []) =>
        old.filter((c) => c.lastMessage?.publicId !== tempMessage.publicId)
      );
    }
  };

  // Mark conversation as read
  const openConversation = (publicId: string) => {
    setActiveConversation(publicId);
    mutateConversations((old = []) =>
      old.map((c) =>
        c.publicId === publicId ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter + sort conversations
  const filteredConversations =
    conversations
      ?.filter((c) => {
        const participantName =
          c.participants?.find((p) => p.publicId !== me?.publicId)?.name || "";
        return participantName.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort(
        (a, b) =>
          new Date(b.lastMessage?.createdAt || b.updatedAt).getTime() -
          new Date(a.lastMessage?.createdAt || a.updatedAt).getTime()
      ) || [];

  const activeConvObj = conversations?.find(
    (c) => c.publicId === activeConversation
  );
  const chatPartner =
    activeConvObj?.participants.find((p) => p.publicId !== me?.publicId) || null;

  // Filter users for new chat
  const filteredUsers =
    users?.filter(
      (u) =>
        u.publicId !== me?.publicId &&
        u.name.toLowerCase().includes(userSearch.toLowerCase())
    ) || [];

  // DP or Initial 
  const profilePic = (user: User | null, size: number = 40) => {
    if (!user) return null;
    if (user.profilePic) {
      return (
        <Image
          src={user.profilePic}
          alt={user.name}
          width={size}
          height={size}
          className="rounded-full"
        />
      );
    }
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-amber-500 flex items-center justify-center text-black font-bold"
      >
        {user.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 relative custom-scrollbar">
      {/* Sidebar */}
      <aside className="w-1/3 border-r border-zinc-800 p-4 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-amber-400">Chats</h2>
          <span
            className={`text-xs ${
              isSocketConnected ? "text-green-500" : "text-red-500"
            }`}
          >
            {isSocketConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {me?.role === Role.ADMIN && (
          <button
            className="w-full bg-amber-500 text-black py-2 rounded mb-3"
            onClick={() => setShowNewChat(true)}
          >
            New Chat
          </button>
        )}

        <input
          type="text"
          className="w-full mb-3 p-2 rounded bg-zinc-900 text-zinc-100"
          placeholder="Search conversations..."
          onChange={(e) => debouncedSetSearchTerm(e.target.value)}
        />

        {filteredConversations.map((c) => {
          const participant =
            c.participants?.find((p) => p.publicId !== me?.publicId) || null;
          return (
            <div
              key={c.publicId}
              className={`p-3 rounded cursor-pointer flex items-center gap-3 ${
                c.publicId === activeConversation
                  ? "bg-zinc-800"
                  : "hover:bg-zinc-900"
              }`}
              onClick={() => openConversation(c.publicId)}
            >
              {profilePic(participant, 40)}
              <div className="flex-1">
                <p className="font-semibold text-zinc-200">
                  {participant?.name || "Unknown"}
                </p>
                <p className="text-xs text-zinc-400 truncate">
                  {c.lastMessage?.content ?? "No messages yet"}
                </p>
              </div>
              <div className="text-xs text-zinc-500 flex flex-col items-end">
                <span>
                  {format(new Date(c.lastMessage?.createdAt || c.updatedAt), "HH:mm")}
                </span>
                {c.unreadCount > 0 && (
                  <span className="bg-amber-500 text-black px-2 rounded-full text-xs mt-1">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        {activeConversation && chatPartner && (
          <div className="flex items-center gap-3 p-4 border-b border-zinc-800 bg-zinc-900">
            {profilePic(chatPartner, 40)}
            <div>
              <p className="font-semibold">{chatPartner.name}</p>
              <span className="text-xs text-zinc-400">{chatPartner.role}</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {messages?.map((m, index) => (
            <MessageBubble
              key={m.publicId || `${m.createdAt}-${index}`}
              message={m}
              isOwnMessage={m.sender?.publicId === me?.publicId}
            />
          ))}
          {/* {typingUsers.length > 0 && (
            <div className="text-xs text-zinc-400 italic">
              {typingUsers
                .map((userId) =>
                  users.find((u) => u.publicId === userId)?.name || "Someone"
                )
                .join(", ")}{" "}
              is typing...
            </div> 
           )} */}
          <div ref={messagesEndRef} />
        </div>

        {activeConversation && (
          <div className="p-4 border-t border-zinc-800 flex gap-2">
            <input
              type="text"
              className="flex-1 rounded bg-zinc-900 p-2 outline-none text-zinc-100"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                // handleTyping();
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type a message..."
            />
            <button
              onClick={handleSendMessage}
              className="bg-amber-500 text-black px-4 py-2 rounded"
            >
              Send
            </button>
          </div>
        )}
      </main>

      {showNewChat && me?.role === Role.ADMIN && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-zinc-900 p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4 text-amber-400">Start New Chat</h3>
            <input
              type="text"
              className="w-full mb-3 p-2 rounded bg-zinc-800 text-zinc-100"
              placeholder="Search users..."
              onChange={(e) => debouncedSetUserSearch(e.target.value)}
            />
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {filteredUsers.map((u) => (
                <div
                  key={u.publicId}
                  className="p-2 rounded hover:bg-zinc-800 cursor-pointer flex items-center gap-3"
                  onClick={() => startConversation(u.publicId)}
                >
                  {profilePic(u, 32)}
                  <div>
                    <p>{u.name}</p>
                    <span className="text-xs text-zinc-400">{u.role}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowNewChat(false)}
              className="mt-4 w-full bg-zinc-800 text-zinc-200 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #71717a;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
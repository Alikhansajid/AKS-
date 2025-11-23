// "use client";

// import React, { JSX } from "react";
// import { useEffect, useState, useRef, memo } from "react";
// import useSWR, { mutate } from "swr";
// import { socket } from "@/lib/socket";
// import { useSession } from "@/lib/hooks/useSession";
// import { format, isToday, isYesterday } from "date-fns";
// import { Role, ConversationType } from "@/types/enums";
// import Image from "next/image";
// import { debounce } from "lodash";
// import toast from "react-hot-toast";

// const fetcher = async (url: string) => {
//   const response = await fetch(url, { credentials: "include" });
//   if (!response.ok) {
//     throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
//   }
//   return response.json();
// };

// // Interfaces for type safety
// interface User {
//   publicId: string;
//   name: string;
//   role: Role;
//   profilePic?: string;
// }

// interface Message {
//   publicId: string;
//   conversationPublicId: string;
//   sender: User;
//   content: string;
//   createdAt: string;
//   status?: string;
// }

// interface Conversation {
//   publicId: string;
//   type: ConversationType;
//   name?: string;
//   description?: string;
//   profilePic?: string;
//   allowAllMessages?: boolean;
//   participants: User[];
//   admins?: User[];
//   lastMessage?: Message;
//   unreadCount: number;
//   updatedAt: string;
// }

// // MessageBubble component for rendering individual chat messages
// const MessageBubble = memo(({ message, isOwnMessage, isGroup }: { message: Message; isOwnMessage: boolean; isGroup: boolean }) => {
//   // Format timestamp for display
//   const formatTime = (date: string) => {
//     if (!date) return "";
//     const d = new Date(date);
//     if (isNaN(d.getTime())) return "";
//     return format(d, "hh:mm a");
//   };

//   // Render user profile picture or fallback initials
//   const renderProfilePic = (user: User) => {
//     if (user.profilePic) {
//       return (
//         <Image
//           src={user.profilePic}
//           alt={user.name}
//           width={30}
//           height={30}
//           className="rounded-full"
//         />
//       );
//     }
//     return (
//       <div
//         style={{ width: 30, height: 30 }}
//         className="rounded-full bg-amber-500 flex items-center justify-center text-black font-bold"
//       >
//         {user.name.charAt(0).toUpperCase()}
//       </div>
//     );
//   };

//   return (
//     <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-3`}>
//       {isGroup && !isOwnMessage && (
//         <div className="flex items-start">
//           <div className="mr-2">{renderProfilePic(message.sender)}</div>
//           <div className="max-w-xs">
//             <p className="text-sm font-semibold text-zinc-300 mb-1">{message.sender.name}</p>
//             <div className="bg-zinc-800 text-white p-2 rounded-lg">
//               <p>{message.content}</p>
//               <span className="text-xs text-zinc-400 mt-1 block">{formatTime(message.createdAt)}</span>
//             </div>
//           </div>
//         </div>
//       )}
//       {isGroup && isOwnMessage && (
//         <div className="max-w-xs">
//           <div className="bg-amber-500 text-black p-2 rounded-lg">
//             <p>{message.content}</p>
//             <span className="text-xs text-zinc-600 mt-1 block">{formatTime(message.createdAt)}</span>
//           </div>
//         </div>
//       )}
//       {!isGroup && (
//         <div
//           className={`max-w-xs p-2 rounded-lg ${
//             isOwnMessage ? "bg-amber-500 text-black" : "bg-zinc-800 text-white"
//           }`}
//         >
//           <p>{message.content}</p>
//           <span className="text-xs text-zinc-400 mt-1 block">{formatTime(message.createdAt)}</span>
//         </div>
//       )}
//     </div>
//   );
// });
// MessageBubble.displayName = "MessageBubble";

// // Render user profile picture or initials
// const profilePic = (user: User | null, size: number = 40) => {
//   if (!user) return null;
//   if (user.profilePic) {
//     return (
//       <Image
//         src={user.profilePic}
//         alt={user.name}
//         width={size}
//         height={size}
//         className="rounded-full"
//       />
//     );
//   }
//   return (
//     <div
//       style={{ width: size, height: size }}
//       className="rounded-full bg-amber-500 flex items-center justify-center text-black font-bold"
//     >
//       {user.name.charAt(0).toUpperCase()}
//     </div>
//   );
// };

// // Render group profile picture or initials
// const groupProfile = (conv: Conversation | undefined, size: number = 40) => {
//   if (!conv) return null;
//   if (conv.profilePic) {
//     return (
//       <Image
//         src={conv.profilePic}
//         alt={conv.name || "Group"}
//         width={size}
//         height={size}
//         className="rounded-full"
//       />
//     );
//   }
//   return (
//     <div
//       style={{ width: size, height: size }}
//       className="rounded-full bg-amber-500 flex items-center justify-center text-black font-bold"
//     >
//       {conv.name?.charAt(0).toUpperCase() || "G"}
//     </div>
//   );
// };

// export default function ChatPage() {
//   const { user: me } = useSession();
//   const [activeConversation, setActiveConversation] = useState<string | null>(null);
//   const [newMessage, setNewMessage] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showNewChat, setShowNewChat] = useState(false);
//   const [isGroupChat, setIsGroupChat] = useState(false);
//   const [showEditGroup, setShowEditGroup] = useState(false);
//   const [groupName, setGroupName] = useState("");
//   const [groupDescription, setGroupDescription] = useState("");
//   const [groupProfilePic, setGroupProfilePic] = useState<File | null>(null);
//   const [groupProfilePreview, setGroupProfilePreview] = useState<string | null>(null);
//   const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
//   const [userSearch, setUserSearch] = useState("");
//   const [allowAllMessages, setAllowAllMessages] = useState(true);
//   const [isSocketConnected, setIsSocketConnected] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [confirmAction, setConfirmAction] = useState<"add" | "remove" | null>(null);
//   const [confirmUser, setConfirmUser] = useState<User | null>(null);

//   const debouncedSetSearchTerm = debounce((value: string) => setSearchTerm(value), 300);
//   const debouncedSetUserSearch = debounce((value: string) => setUserSearch(value), 300);

//   // Fetch conversations using SWR
//   const {
//     data: conversations,
//     mutate: mutateConversations,
//   } = useSWR<Conversation[]>("/api/conversations", fetcher);

//   // Fetch messages for the active conversation using SWR
//   const {
//     data: messages,
//     mutate: mutateMessages,
//   } = useSWR<Message[]>(
//     activeConversation ? `/api/conversations/${activeConversation}/messages` : null,
//     fetcher
//   );

//   // Fetch users for admin user selection using SWR
//   const { data: rawUsers, error: usersError } = useSWR("/api/admin/users", fetcher);
//   const users: User[] = Array.isArray(rawUsers) ? rawUsers : rawUsers?.users || [];

//   // Display error message if fetching users fails
//   useEffect(() => {
//     if (usersError) {
//       console.error("Failed to fetch users:", usersError.message);
//       toast.error("Failed to load users. Please try again.");
//     }
//   }, [usersError]);

//   // Handle profile pic preview
//   useEffect(() => {
//     if (groupProfilePic) {
//       const previewUrl = URL.createObjectURL(groupProfilePic);
//       setGroupProfilePreview(previewUrl);
//       return () => URL.revokeObjectURL(previewUrl);
//     } else {
//       setGroupProfilePreview(null);
//     }
//   }, [groupProfilePic]);

//   // Send a message to the active conversation
//   const sendMessage = async (content: string, senderPublicId: string) => {
//     if (!activeConversation) throw new Error("No active conversation");
//     try {
//       const response = await fetch(`/api/conversations/${activeConversation}/messages`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify({ content, senderPublicId }),
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to send message");
//       }
//       const data = await response.json();
//       await mutateMessages(); // Revalidate messages
//       return data;
//     } catch (err) {
//       throw new Error((err as Error).message || "Failed to send message");
//     }
//   };

//   // Start a new direct conversation with a user
//   const startNewConversation = async (participantPublicId: string) => {
//     try {
//       const response = await fetch("/api/conversations", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify({ participantPublicId }),
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to start conversation");
//       }
//       const data = await response.json();
//       await mutateConversations(); // Revalidate conversations
//       return data;
//     } catch (err) {
//       throw new Error((err as Error).message || "Failed to start conversation");
//     }
//   };

//   // Create a new group conversation
//   const createGroupConversation = async (arg: {
//     name: string;
//     description?: string;
//     participantPublicIds: string[];
//     profilePic?: string | File;
//     adminPublicId?: string;
//   }) => {
//     try {
//       const formData = new FormData();
//       formData.append("name", arg.name);
//       if (arg.description) formData.append("description", arg.description);
//       formData.append("participantPublicIds", JSON.stringify([...arg.participantPublicIds, me?.publicId || ""]));
//       if (arg.adminPublicId) formData.append("adminPublicId", arg.adminPublicId);

//       // Handle profile picture upload
//       if (arg.profilePic) {
//         if (arg.profilePic instanceof File) {
//           const uploadFormData = new FormData();
//           uploadFormData.append("file", arg.profilePic);
//           const uploadResponse = await fetch("/api/upload", {
//             method: "POST",
//             credentials: "include",
//             body: uploadFormData,
//           });
//           if (!uploadResponse.ok) {
//             const errorData = await uploadResponse.json();
//             throw new Error(errorData.error || "Failed to upload profile picture");
//           }
//           const uploadData = await uploadResponse.json();
//           if (uploadData.url) formData.append("profilePic", uploadData.url);
//         } else {
//           formData.append("profilePic", arg.profilePic);
//         }
//       }

//       const response = await fetch("/api/conversations/group", {
//         method: "POST",
//         credentials: "include",
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error("Error response from /api/conversations/group:", errorData);
//         throw new Error(errorData.error || `Failed to create group (Status: ${response.status})`);
//       }

//       const data = await response.json();
//       await mutateConversations(); // Revalidate conversations
//       return data.conversation;
//     } catch (err) {
//       console.error("Error in createGroupConversation:", {
//         error: err instanceof Error ? err.message : String(err),
//         stack: err instanceof Error ? err.stack : undefined,
//       });
//       throw new Error(err instanceof Error ? err.message : "Failed to create group");
//     }
//   };

//   // Update group conversation settings
//   const updateGroup = async (arg: { name?: string; description?: string; profilePic?: string | File }) => {
//     if (!activeConversation) throw new Error("No active conversation");
//     try {
//       const formData = new FormData();
//       if (arg.name) formData.append("name", arg.name);
//       if (arg.description) formData.append("description", arg.description);
//       if (arg.profilePic) {
//         if (arg.profilePic instanceof File) {
//           const uploadFormData = new FormData();
//           uploadFormData.append("file", arg.profilePic);
//           const uploadResponse = await fetch("/api/upload", {
//             method: "POST",
//             credentials: "include",
//             body: uploadFormData,
//           });
//           if (!uploadResponse.ok) {
//             const errorData = await uploadResponse.json();
//             throw new Error(errorData.error || "Failed to upload profile picture");
//           }
//           const uploadData = await uploadResponse.json();
//           if (uploadData.url) formData.append("profilePic", uploadData.url);
//         } else if (typeof arg.profilePic === "string") {
//           formData.append("profilePic", arg.profilePic);
//         }
//       }

//       const response = await fetch(`/api/conversations/group/${activeConversation}`, {
//         method: "PATCH",
//         credentials: "include",
//         body: formData,
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to update group");
//       }
//       const data = await response.json();
//       await mutateConversations(); // Revalidate conversations
//       return data.conversation;
//     } catch (err) {
//       throw new Error((err as Error).message || "Failed to update group");
//     }
//   };

//   // Manage group admin status (add or remove admin)
//   const manageGroupAdmin = async (arg: { userPublicId: string; action: "add" | "remove" }) => {
//     if (!activeConversation) throw new Error("No active conversation");
//     if (!arg.userPublicId) throw new Error("userPublicId is missing");
//     try {
//       console.log("manageGroupAdmin payload:", arg);
//       const response = await fetch(`/api/conversations/group/${activeConversation}/admins`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify(arg),
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to manage admin");
//       }
//       const data = await response.json();
//       await mutateConversations(); // Revalidate conversations
//       await mutate(`/api/conversations/${activeConversation}`); // Revalidate active conversation
//       toast.success(`User ${arg.action === "add" ? "promoted to" : "removed as"} admin`);
//       return data.conversation;
//     } catch (err) {
//       console.error("manageGroupAdmin error:", (err as Error).message);
//       throw new Error((err as Error).message || "Failed to manage admin");
//     }
//   };

//   // Add a member to a group conversation
//   const addGroupMember = async (userPublicId: string) => {
//     if (!activeConversation) {
//       toast.error("No active conversation selected");
//       throw new Error("No active conversation");
//     }
//     if (!userPublicId || typeof userPublicId !== "string") {
//       toast.error("Invalid user selected");
//       throw new Error("Invalid userPublicId");
//     }

//     try {
//       console.log("Adding group member:", { activeConversation, userPublicId });
//       const response = await fetch(`/api/conversations/group/${activeConversation}/members`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify({ userPublicId, action: "add" }),
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         toast.error(errorData.error || "Failed to add member");
//         throw new Error(errorData.error || "Failed to add member");
//       }
//       const data = await response.json();
//       await mutateConversations(); // Revalidate conversations
//       await mutate(`/api/conversations/${activeConversation}`); // Revalidate active conversation
//       toast.success("Member added successfully");
//       return data.conversation;
//     } catch (err) {
//       console.error("Failed to add group member:", {
//         error: err instanceof Error ? err.message : String(err),
//         stack: err instanceof Error ? err.stack : undefined,
//       });
//       toast.error((err as Error).message || "Failed to add member");
//       throw new Error((err as Error).message || "Failed to add member");
//     }
//   };

//   // Remove a member from a group conversation
//   const removeGroupMember = async (userPublicId: string) => {
//     if (!activeConversation) throw new Error("No active conversation");
//     try {
//       const response = await fetch(`/api/conversations/group/${activeConversation}/members`, {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify({ userPublicId }),
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         toast.error(errorData.error || "Failed to remove member");
//         throw new Error(errorData.error || "Failed to remove member");
//       }
//       const data = await response.json();
//       await mutateConversations(); // Revalidate conversations
//       await mutate(`/api/conversations/${activeConversation}`); // Revalidate active conversation
//       toast.success("Member removed successfully");
//       return data.conversation;
//     } catch (err) {
//       console.error("Failed to remove group member:", {
//         error: err instanceof Error ? err.message : String(err),
//         stack: err instanceof Error ? err.stack : undefined,
//       });
//       throw new Error((err as Error).message || "Failed to remove member");
//     }
//   };

//   // Toggle messaging permissions for a group
//   const toggleMessagingPermissions = async (allowAllMessages: boolean) => {
//     if (!activeConversation) throw new Error("No active conversation");
//     try {
//       const response = await fetch(`/api/conversations/group/${activeConversation}/permissions`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify({ allowAllMessages }),
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to update permissions");
//       }
//       const data = await response.json();
//       await mutateConversations(); // Revalidate conversations
//       await mutate(`/api/conversations/${activeConversation}`); // Revalidate active conversation
//       toast.success("Permissions updated successfully");
//       return data.conversation;
//     } catch (err) {
//       throw new Error((err as Error).message || "Failed to update permissions");
//     }
//   };

//   // Handle Socket.IO events and polling
//   useEffect(() => {
//     fetch("/api/socket/io", { credentials: "include" })
//       .then(() => console.log("Socket.IO server initialization triggered"))
//       .catch((err) => console.error("Failed to initialize Socket.IO server:", err.message));

//     socket.on("connect", () => setIsSocketConnected(true));
//     socket.on("disconnect", () => setIsSocketConnected(false));

//     if (me?.publicId) {
//       socket.emit("join", { publicId: me.publicId });
//     }

//     socket.on("message:active", (msg: Message) => {
//       if (activeConversation === msg.conversationPublicId) {
//         mutateMessages((old = []) => {
//           if (old.some((m) => m.publicId === msg.publicId)) return old;
//           return [...old, msg];
//         }, false);
//       }
//     });

//     socket.on("message:sidebar", (msg: Message | Conversation) => {
//       mutateConversations((old = []) => {
//         const exists = old.find((c) => c.publicId === msg.publicId || ("conversationPublicId" in msg && c.publicId === msg.conversationPublicId));

//         if ("content" in msg) {
//           if (exists) {
//             return [
//               {
//                 ...exists,
//                 lastMessage: msg,
//                 unreadCount:
//                   activeConversation === msg.conversationPublicId
//                     ? 0
//                     : exists.unreadCount + (msg.sender.publicId !== me?.publicId ? 1 : 0),
//                 updatedAt: msg.createdAt,
//               },
//               ...old
//                 .filter((c) => c.publicId !== msg.conversationPublicId)
//                 .sort(
//                   (a, b) =>
//                     new Date(b.lastMessage?.createdAt || b.updatedAt).getTime() -
//                     new Date(a.lastMessage?.createdAt || a.updatedAt).getTime()
//                 ),
//             ];
//           }
//           return [
//             {
//               publicId: msg.conversationPublicId,
//               type: ConversationType.DIRECT,
//               participants: [msg.sender],
//               lastMessage: msg,
//               unreadCount: activeConversation === msg.conversationPublicId ? 0 : 1,
//               updatedAt: msg.createdAt,
//             },
//             ...old,
//           ];
//         } else {
//           if (exists) {
//             return [
//               {
//                 ...exists,
//                 ...msg,
//               },
//               ...old
//                 .filter((c) => c.publicId !== msg.publicId)
//                 .sort(
//                   (a, b) =>
//                     new Date(b.lastMessage?.createdAt || b.updatedAt).getTime() -
//                     new Date(a.lastMessage?.createdAt || a.updatedAt).getTime()
//                 ),
//             ];
//           }
//           return [msg, ...old];
//         }
//       }, false);

//       if ("publicId" in msg && msg.publicId === activeConversation) {
//         mutate(`/api/conversations/${activeConversation}`, undefined, { revalidate: true });
//       }
//     });

//     socket.on("conversation:new", (conv: Conversation) => {
//       mutateConversations((old = []) => {
//         if (old.some((c) => c.publicId === conv.publicId)) return old;
//         return [conv, ...old];
//       }, false);
//     });

//     socket.on("conversation:removed", (data: { conversationId: string }) => {
//       if (data.conversationId === activeConversation) {
//         setActiveConversation(null);
//       }
//       mutateConversations((old = []) => old.filter((c) => c.publicId !== data.conversationId), false);
//     });

//     return () => {
//       socket.off("connect");
//       socket.off("disconnect");
//       socket.off("message:active");
//       socket.off("message:sidebar");
//       socket.off("conversation:new");
//       socket.off("conversation:removed");
//     };
//   }, [activeConversation, me?.publicId, mutateConversations, mutateMessages]);

//   // Poll conversations when socket is disconnected
//   useEffect(() => {
//     if (!isSocketConnected) {
//       const interval = setInterval(() => {
//         mutate("/api/conversations");
//       }, 30000);
//       return () => clearInterval(interval);
//     }
//   }, [isSocketConnected]);

//   // Join/leave conversation socket room
//   useEffect(() => {
//     if (activeConversation && me?.publicId) {
//       socket.emit("join", { conversationId: activeConversation });
//     }
//     return () => {
//       if (activeConversation) {
//         socket.emit("leave", { conversationId: activeConversation });
//       }
//     };
//   }, [activeConversation, me?.publicId]);

//   // Open a conversation and mark messages as read
//   const openConversation = async (publicId: string) => {
//     setActiveConversation(publicId);
//     try {
//       const response = await fetch(`/api/conversations/${publicId}/read`, {
//         method: "POST",
//         credentials: "include",
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to mark messages as read");
//       }
//       mutateConversations(
//         (old = []) =>
//           old.map((c) =>
//             c.publicId === publicId ? { ...c, unreadCount: 0 } : c
//           ),
//         false
//       );
//     } catch (err) {
//       console.error("Failed to mark messages as read:", (err as Error).message);
//       toast.error((err as Error).message || "Failed to mark messages as read");
//     }
//   };

//   // Start a new direct conversation with a user
//   const startConversation = async (userPublicId: string) => {
//     try {
//       const data = await startNewConversation(userPublicId);
//       setActiveConversation(data.conversation.publicId);
//       setShowNewChat(false);
//       toast.success("Conversation started");
//     } catch (err) {
//       console.error("Failed to start conversation", (err as Error).message);
//       toast.error((err as Error).message);
//     }
//   };

//   // Create a new group conversation
//   const createGroup = async () => {
//     if (!groupName || selectedUsers.length === 0) {
//       toast.error("Group name and at least one participant are required");
//       return;
//     }
//     if (!me?.publicId) {
//       toast.error("User session is invalid. Please log in again.");
//       return;
//     }
//     if (selectedUsers.some((id) => !id || typeof id !== "string")) {
//       toast.error("One or more selected user IDs are invalid.");
//       return;
//     }

//     try {
//       let profilePicUrl: string | undefined;
//       if (groupProfilePic) {
//         const formData = new FormData();
//         formData.append("file", groupProfilePic);
//         const uploadResponse = await fetch("/api/upload", {
//           method: "POST",
//           credentials: "include",
//           body: formData,
//         });
//         if (!uploadResponse.ok) {
//           const errorData = await uploadResponse.json();
//           throw new Error(errorData.error || "Failed to upload profile picture");
//         }
//         const uploadData = await uploadResponse.json();
//         if (uploadData.url) profilePicUrl = uploadData.url;
//       }

//       const participantPublicIds = [me.publicId, ...selectedUsers];
//       const conv: Conversation = await createGroupConversation({
//         name: groupName,
//         description: groupDescription,
//         participantPublicIds,
//         profilePic: profilePicUrl,
//         adminPublicId: me.publicId,
//       });
//       setGroupName("");
//       setGroupDescription("");
//       setGroupProfilePic(null);
//       setSelectedUsers([]);
//       setShowNewChat(false);
//       setIsGroupChat(false);
//       setActiveConversation(conv.publicId);
//       toast.success("Group created successfully");
//     } catch (err) {
//       console.error("Failed to create group", (err as Error).message);
//       toast.error((err as Error).message || "Failed to create group");
//     }
//   };

//   // Update group settings
//   const updateGroupSettings = async () => {
//     try {
//       let profilePicUrl: string | undefined;
//       if (groupProfilePic) {
//         const maxFileSize = 10 * 1024 * 1024;
//         if (groupProfilePic.size > maxFileSize) {
//           toast.error("Profile picture exceeds 10MB limit");
//           return;
//         }

//         const formData = new FormData();
//         formData.append("file", groupProfilePic);
//         const uploadResponse = await fetch("/api/upload", {
//           method: "POST",
//           credentials: "include",
//           body: formData,
//         });
//         if (!uploadResponse.ok) {
//           const errorData = await uploadResponse.json();
//           throw new Error(errorData.error || "Failed to upload profile picture");
//         }
//         const uploadData = await uploadResponse.json();
//         if (uploadData.url) profilePicUrl = uploadData.url;
//       }

//       await updateGroup({
//         name: groupName || undefined,
//         description: groupDescription || undefined,
//         profilePic: profilePicUrl,
//       });
//       await toggleMessagingPermissions(allowAllMessages);
//       setShowEditGroup(false);
//       setGroupName("");
//       setGroupDescription("");
//       setGroupProfilePic(null);
//       toast.success("Group updated successfully");
//     } catch (err) {
//       console.error("Failed to update group", {
//         error: err instanceof Error ? err.message : String(err),
//         stack: err instanceof Error ? err.stack : undefined,
//       });
//       toast.error((err as Error).message || "Failed to update group");
//     }
//   };

//   // Handle confirm admin action
//   const handleConfirmAdmin = async () => {
//     if (!confirmUser || !confirmAction || !activeConversation) return;
//     try {
//       await manageGroupAdmin({ userPublicId: confirmUser.publicId, action: confirmAction });
//       // Force revalidation of the active conversation
//       await mutate(`/api/conversations/${activeConversation}`, undefined, { revalidate: true });
//     } catch {
//       // Error handled in manageGroupAdmin
//     }
//     setShowConfirm(false);
//     setConfirmUser(null);
//     setConfirmAction(null);
//   };

//   // Handle sending a new message
//   const handleSendMessage = async () => {
//     if (!newMessage.trim() || !me || !activeConversation) return;

//     const activeConv = conversations?.find((c) => c.publicId === activeConversation);
//     if (
//       activeConv?.type === ConversationType.GROUP &&
//       !activeConv.allowAllMessages &&
//       !activeConv.admins?.some((admin) => admin.publicId === me?.publicId)
//     ) {
//       toast.error("Only admins can send messages in this group");
//       return;
//     }

//     const tempMessage: Message = {
//       publicId: `temp-${Date.now()}`,
//       conversationPublicId: activeConversation,
//       sender: me,
//       content: newMessage,
//       createdAt: new Date().toISOString(),
//       status: "SENT",
//     };

//     mutateMessages((old = []) => [...old, tempMessage], false);
//     mutateConversations((old = []) => {
//       const exists = old.find((c) => c.publicId === activeConversation);
//       if (exists) {
//         return [
//           {
//             ...exists,
//             lastMessage: tempMessage,
//             updatedAt: tempMessage.createdAt,
//           },
//           ...old
//             .filter((c) => c.publicId !== activeConversation)
//             .sort(
//               (a, b) =>
//                 new Date(b.lastMessage?.createdAt || b.updatedAt).getTime() -
//                 new Date(a.lastMessage?.createdAt || a.updatedAt).getTime()
//             ),
//         ];
//       }
//       return old;
//     }, false);
//     setNewMessage("");

//     try {
//       const saved: Message = await sendMessage(tempMessage.content, me.publicId);
//       mutateMessages((old = []) =>
//         old.map((m) => (m.publicId === tempMessage.publicId ? saved : m))
//       );
//       mutateConversations((old = []) => {
//         const exists = old.find((c) => c.publicId === activeConversation);
//         if (exists) {
//           return [
//             {
//               ...exists,
//               lastMessage: saved,
//               updatedAt: saved.createdAt,
//             },
//             ...old
//               .filter((c) => c.publicId !== activeConversation)
//               .sort(
//                 (a, b) =>
//                   new Date(b.lastMessage?.createdAt || b.updatedAt).getTime() -
//                   new Date(a.lastMessage?.createdAt || a.updatedAt).getTime()
//               ),
//           ];
//         }
//         return old;
//       }, false);
//     } catch (err) {
//       console.error("Failed to send message:", (err as Error).message);
//       mutateMessages((old = []) =>
//         old.filter((m) => m.publicId !== tempMessage.publicId)
//       );
//       mutateConversations((old = []) =>
//         old.filter((c) => c.lastMessage?.publicId !== tempMessage.publicId)
//       );
//       toast.error((err as Error).message);
//     }
//   };

//   // Scroll to the latest message
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Filter conversations based on search term
//   const filteredConversations =
//     (conversations ?? []).filter((c) => {
//       const participantName =
//         c.type === ConversationType.GROUP
//           ? c.name || "Unknown Group"
//           : c.participants?.find((p) => p.publicId !== me?.publicId)?.name || "Unknown";
//       return participantName?.toLowerCase().includes(searchTerm.toLowerCase());
//     }).sort(
//       (a, b) =>
//         new Date(b.lastMessage?.createdAt || b.updatedAt).getTime() -
//         new Date(a.lastMessage?.createdAt || a.updatedAt).getTime()
//     ) || [];

//   // Get the active conversation object
//   const activeConvObj = conversations?.find(
//     (c) => c.publicId === activeConversation
//   );

//   // Get the chat partner for direct conversations
//   const chatPartner =
//     activeConvObj?.type === ConversationType.DIRECT
//       ? activeConvObj?.participants.find((p) => p.publicId !== me?.publicId) || null
//       : null;

//   // Filter users for adding to group
//   const filteredUsers =
//     users?.filter(
//       (u) =>
//         u.publicId !== me?.publicId &&
//         u.name.toLowerCase().includes(userSearch.toLowerCase())
//     ) || [];

//   // Check if the current user is a group admin
//   const isGroupAdmin = activeConvObj?.type === ConversationType.GROUP &&
//     (activeConvObj.admins?.some((admin) => admin.publicId === me?.publicId) || me?.role === Role.ADMIN);

//   // Render messages with date headers
//   const renderMessagesWithDates = () => {
//     if (!messages) return null;
//     const grouped: JSX.Element[] = [];
//     let lastDate: string | null = null;

//     messages.forEach((m, index) => {
//       const messageDate = format(new Date(m.createdAt), "yyyy-MM-dd");
//       if (messageDate !== lastDate) {
//         let dateLabel = "";
//         const dateObj = new Date(m.createdAt);
//         if (isToday(dateObj)) {
//           dateLabel = "Today";
//         } else if (isYesterday(dateObj)) {
//           dateLabel = "Yesterday";
//         } else {
//           dateLabel = format(dateObj, "MMMM d, yyyy");
//         }
//         grouped.push(
//           <div key={`date-${messageDate}`} className="text-center text-zinc-400 text-sm my-4">
//             {dateLabel}
//           </div>
//         );
//         lastDate = messageDate;
//       }
//       grouped.push(
//         <MessageBubble
//           key={m.publicId || `${m.createdAt}-${index}`}
//           message={m}
//           isOwnMessage={m.sender?.publicId === me?.publicId}
//           isGroup={activeConvObj?.type === ConversationType.GROUP}
//         />
//       );
//     });
//     return grouped;
//   };

//   return (
//     <div className="flex h-screen bg-zinc-950 text-zinc-100 relative custom-scrollbar">
//       <aside className="w-1/3 border-r border-zinc-800 p-4 overflow-y-auto custom-scrollbar">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-lg font-bold text-amber-400">Chats</h2>
//           <span
//             className={`text-xs ${
//               isSocketConnected ? "text-green-500" : "text-red-500"
//             }`}
//           >
//             {isSocketConnected ? "Connected" : "Disconnected"}
//           </span>
//         </div>

//         {me?.role === Role.ADMIN && (
//           <div className="flex gap-2 mb-3">
//             <button
//               className="flex-1 bg-amber-500 text-black py-2 rounded"
//               onClick={() => {
//                 setShowNewChat(true);
//                 setIsGroupChat(false);
//                 setGroupName("");
//                 setGroupDescription("");
//                 setGroupProfilePic(null);
//                 setSelectedUsers([]);
//               }}
//             >
//               New Chat
//             </button>
//             <button
//               className="flex-1 bg-amber-500 text-black py-2 rounded"
//               onClick={() => {
//                 setShowNewChat(true);
//                 setIsGroupChat(true);
//                 setGroupName("");
//                 setGroupDescription("");
//                 setGroupProfilePic(null);
//                 setSelectedUsers([]);
//               }}
//             >
//               New Group
//             </button>
//           </div>
//         )}

//         <input
//           type="text"
//           className="w-full mb-3 p-2 rounded bg-zinc-900 text-zinc-100"
//           placeholder="Search conversations..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//         />

//         {filteredConversations.map((c) => {
//           const participant =
//             c.type === ConversationType.DIRECT
//               ? c.participants?.find((p) => p.publicId !== me?.publicId) || null
//               : null;
//           return (
//             <div
//               key={c.publicId}
//               className={`p-3 rounded cursor-pointer flex items-center gap-3 ${
//                 c.publicId === activeConversation
//                   ? "bg-zinc-800"
//                   : "hover:bg-zinc-900"
//               }`}
//               onClick={() => openConversation(c.publicId)}
//             >
//               {c.type === ConversationType.GROUP
//                 ? groupProfile(c, 40)
//                 : profilePic(participant, 40)}
//               <div className="flex-1">
//                 <p className="font-semibold text-zinc-200">
//                   {c.type === ConversationType.GROUP
//                     ? c.name || "Unknown Group"
//                     : participant?.name || "Unknown"}
//                 </p>
//                 <p className="text-xs text-zinc-400 truncate">
//                   {c.lastMessage?.content ?? "No messages yet"}
//                 </p>
//               </div>
//               <div className="text-xs text-zinc-500 flex flex-col items-end">
//                 <span>
//                   {format(new Date(c.lastMessage?.createdAt || c.updatedAt), "hh:mm a")}
//                 </span>
//                 {c.unreadCount > 0 && (
//                   <span className="bg-amber-500 text-black px-2 rounded-full text-xs mt-1">
//                     {c.unreadCount}
//                   </span>
//                 )}
//               </div>
//             </div>
//           );
//         })}
//       </aside>

//       <main className="flex-1 flex flex-col">
//         {activeConversation && activeConvObj && (
//           <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
//             <div className="flex items-center gap-3">
//               {activeConvObj.type === ConversationType.GROUP
//                 ? groupProfile(activeConvObj, 40)
//                 : profilePic(chatPartner, 40)}
//               <div>
//                 <p className="font-semibold">
//                   {activeConvObj.type === ConversationType.GROUP
//                     ? activeConvObj.name || "Unknown Group"
//                     : chatPartner?.name || "Unknown"}
//                 </p>
//                 <span className="text-xs text-zinc-400">
//                   {activeConvObj.type === ConversationType.GROUP
//                     ? activeConvObj.description || "Group chat"
//                     : chatPartner?.role}
//                 </span>
//               </div>
//             </div>
//             {activeConvObj.type === ConversationType.GROUP && isGroupAdmin && (
//               <button
//                 className="text-amber-500 hover:text-amber-400 px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600"
//                 onClick={() => {
//                   setShowEditGroup(true);
//                   setGroupName(activeConvObj.name || "");
//                   setGroupDescription(activeConvObj.description || "");
//                   setAllowAllMessages(activeConvObj.allowAllMessages ?? true);
//                 }}
//               >
//                 Edit
//               </button>
//             )}
//           </div>
//         )}

//         <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
//           {renderMessagesWithDates()}
//           <div ref={messagesEndRef} />
//         </div>

//         {activeConversation && activeConvObj && (
//           <div className="p-4 border-t border-zinc-800">
//             {activeConvObj.type === ConversationType.GROUP &&
//             !activeConvObj.allowAllMessages &&
//             !activeConvObj.admins?.some((admin) => admin.publicId === me?.publicId) ? (
//               <p className="text-center text-zinc-400">Only admins can message in this group</p>
//             ) : (
//               <div className="flex gap-2">
//                 <input
//                   type="text"
//                   className="flex-1 rounded bg-zinc-900 p-2 outline-none text-zinc-100"
//                   value={newMessage}
//                   onChange={(e) => setNewMessage(e.target.value)}
//                   onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
//                   placeholder="Type a message..."
//                 />
//                 <button
//                   onClick={handleSendMessage}
//                   className="bg-amber-500 text-black px-4 py-2 rounded hover:bg-amber-600"
//                 >
//                   Send
//                 </button>
//               </div>
//             )}
//           </div>
//         )}
//       </main>

//       {showNewChat && (me?.role === Role.ADMIN || isGroupAdmin) && (
//         <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
//           <div className="bg-zinc-900 p-6 rounded-lg w-96">
//             <h3 className="text-lg font-bold mb-4 text-amber-400">
//               {isGroupChat ? "Create Group Chat" : "Start New Chat"}
//             </h3>
//             {usersError && (
//               <p className="text-red-500 mb-3">Error loading users. Please try again later.</p>
//             )}
//             {isGroupChat && (
//               <>
//                 <input
//                   type="text"
//                   className="w-full mb-3 p-2 rounded bg-zinc-800 text-zinc-100"
//                   placeholder="Group name"
//                   value={groupName}
//                   onChange={(e) => setGroupName(e.target.value)}
//                 />
//                 <textarea
//                   className="w-full mb-3 p-2 rounded bg-zinc-800 text-zinc-100"
//                   placeholder="Group description"
//                   value={groupDescription}
//                   onChange={(e) => setGroupDescription(e.target.value)}
//                 />
//                 <div className="mb-3">
//                   <input
//                     type="file"
//                     accept="image/*"
//                     className="w-full p-2 rounded bg-zinc-800 text-zinc-100"
//                     onChange={(e) => setGroupProfilePic(e.target.files?.[0] || null)}
//                   />
//                   {groupProfilePreview && (
//                     <div className="relative mt-2">
//                       <Image
//                         src={groupProfilePreview}
//                         alt="Profile Preview"
//                         width={100}
//                         height={100}
//                         className="rounded"
//                       />
//                       <button
//                         onClick={() => setGroupProfilePic(null)}
//                         className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
//                       >
//                         <svg
//                           className="w-4 h-4"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                           xmlns="http://www.w3.org/2000/svg"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M6 18L18 6M6 6l12 12"
//                           />
//                         </svg>
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </>
//             )}
//             <input
//               type="text"
//               className="w-full mb-3 p-2 rounded bg-zinc-800 text-zinc-100"
//               placeholder="Search users..."
//               onChange={(e) => debouncedSetUserSearch(e.target.value)}
//             />
//             <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
//               {users.length === 0 && !usersError && (
//                 <p className="text-zinc-400">No users found.</p>
//               )}
//               {filteredUsers.map((u) => (
//                 <div
//                   key={u.publicId}
//                   className={`p-2 rounded cursor-pointer flex items-center justify-between gap-3 ${
//                     isGroupChat && selectedUsers.includes(u.publicId)
//                       ? "bg-zinc-800"
//                       : "hover:bg-zinc-800"
//                   }`}
//                   onClick={() =>
//                     isGroupChat
//                       ? setSelectedUsers((prev) =>
//                           prev.includes(u.publicId)
//                             ? prev.filter((id) => id !== u.publicId)
//                             : [...prev, u.publicId]
//                         )
//                       : startConversation(u.publicId)
//                   }
//                 >
//                   <div className="flex items-center gap-3">
//                     {profilePic(u, 32)}
//                     <div>
//                       <p>{u.name}</p>
//                       <span className="text-xs text-zinc-400">{u.role}</span>
//                     </div>
//                   </div>
//                   {isGroupChat && selectedUsers.includes(u.publicId) && (
//                     <svg
//                       className="w-5 h-5 text-amber-500"
//                       fill="currentColor"
//                       viewBox="0 0 20 20"
//                       xmlns="http://www.w3.org/2000/svg"
//                     >
//                       <path
//                         fillRule="evenodd"
//                         d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                         clipRule="evenodd"
//                       />
//                     </svg>
//                   )}
//                 </div>
//               ))}
//             </div>
//             <div className="flex gap-2 mt-4">
//               <button
//                 onClick={() => {
//                   setShowNewChat(false);
//                   setIsGroupChat(false);
//                   setGroupName("");
//                   setGroupDescription("");
//                   setGroupProfilePic(null);
//                   setSelectedUsers([]);
//                 }}
//                 className="flex-1 bg-zinc-800 text-zinc-200 py-2 rounded hover:bg-zinc-700"
//               >
//                 Cancel
//               </button>
//               {isGroupChat && (
//                 <button
//                   onClick={createGroup}
//                   className="flex-1 bg-amber-500 text-black py-2 rounded hover:bg-amber-600"
//                   disabled={usersError}
//                 >
//                   Create Group
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {showEditGroup && activeConvObj?.type === ConversationType.GROUP && isGroupAdmin && (
//         <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
//           <div className="bg-zinc-900 p-6 rounded-lg w-96">
//             <h3 className="text-lg font-bold mb-4 text-amber-400">Edit Group</h3>
//             <input
//               type="text"
//               className="w-full mb-3 p-2 rounded bg-zinc-800 text-zinc-100"
//               placeholder="Group name"
//               value={groupName}
//               onChange={(e) => setGroupName(e.target.value)}
//             />
//             <textarea
//               className="w-full mb-3 p-2 rounded bg-zinc-800 text-zinc-100"
//               placeholder="Group description"
//               value={groupDescription}
//               onChange={(e) => setGroupDescription(e.target.value)}
//             />
//             <div className="mb-3">
//               <input
//                 type="file"
//                 accept="image/*"
//                 className="w-full p-2 rounded bg-zinc-800 text-zinc-100"
//                 onChange={(e) => setGroupProfilePic(e.target.files?.[0] || null)}
//               />
//               {groupProfilePreview && (
//                 <div className="relative mt-2">
//                   <Image
//                     src={groupProfilePreview}
//                     alt="Profile Preview"
//                     width={100}
//                     height={100}
//                     className="rounded"
//                   />
//                   <button
//                     onClick={() => setGroupProfilePic(null)}
//                     className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
//                   >
//                     <svg
//                       className="w-4 h-4"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                       xmlns="http://www.w3.org/2000/svg"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M6 18L18 6M6 6l12 12"
//                       />
//                     </svg>
//                   </button>
//                 </div>
//               )}
//             </div>
//             <div className="mb-3">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <div className="relative">
//                   <input
//                     type="checkbox"
//                     checked={allowAllMessages}
//                     onChange={(e) => setAllowAllMessages(e.target.checked)}
//                     className="sr-only"
//                   />
//                   <div className={`w-5 h-5 bg-zinc-800 rounded border border-zinc-600 ${allowAllMessages ? 'bg-amber-500' : ''}`}>
//                     {allowAllMessages && (
//                       <svg
//                         className="w-5 h-5 text-black"
//                         fill="currentColor"
//                         viewBox="0 0 20 20"
//                         xmlns="http://www.w3.org/2000/svg"
//                       >
//                         <path
//                           fillRule="evenodd"
//                           d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                           clipRule="evenodd"
//                         />
//                       </svg>
//                     )}
//                   </div>
//                 </div>
//                 <span>Allow all members to send messages</span>
//               </label>
//             </div>
//             <div className="mb-3">
//               <input
//                 type="text"
//                 className="w-full mb-3 p-2 rounded bg-zinc-800 text-zinc-100"
//                 placeholder="Search users to add..."
//                 onChange={(e) => debouncedSetUserSearch(e.target.value)}
//               />
//               {filteredUsers
//                 .filter((u) => !activeConvObj.participants.some((p) => p.publicId === u.publicId))
//                 .map((u) => (
//                   <div
//                     key={u.publicId}
//                     className="p-2 rounded cursor-pointer flex items-center justify-between gap-3 hover:bg-zinc-800"
//                     onClick={() => addGroupMember(u.publicId)}
//                   >
//                     <div className="flex items-center gap-3">
//                       {profilePic(u, 32)}
//                       <div>
//                         <p>{u.name}</p>
//                         <span className="text-xs text-zinc-400">{u.role}</span>
//                       </div>
//                     </div>
//                     <svg
//                       className="w-5 h-5 text-amber-500"
//                       fill="currentColor"
//                       viewBox="0 0 20 20"
//                       xmlns="http://www.w3.org/2000/svg"
//                     >
//                       <path
//                         fillRule="evenodd"
//                         d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
//                         clipRule="evenodd"
//                       />
//                     </svg>
//                   </div>
//                 ))}
//             </div>
//             <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
//               <h4 className="text-sm font-semibold text-amber-400">Admins</h4>
//               {activeConvObj.admins?.map((u) => (
//                 <div
//                   key={u.publicId}
//                   className="p-2 rounded flex items-center justify-between gap-3 hover:bg-zinc-800 transition-colors duration-200"
//                 >
//                   <div className="flex items-center gap-3">
//                     {profilePic(u, 32)}
//                     <div>
//                       <p className="text-sm font-medium">{u.name}</p>
//                       <span className="text-xs text-amber-500">Group Admin</span>
//                     </div>
//                   </div>
//                   {me?.publicId !== u.publicId && (
//                     <div className="flex gap-2">
//                       <button
//                         disabled={activeConvObj.admins?.length === 1}
//                         onClick={() => {
//                           if (!u.publicId) {
//                             toast.error("Invalid user ID");
//                             return;
//                           }
//                           setConfirmAction("remove");
//                           setConfirmUser(u);
//                           setShowConfirm(true);
//                         }}
//                         className={`p-1 rounded-full hover:bg-zinc-700 transition-colors duration-200 ${
//                           activeConvObj.admins?.length === 1 ? "opacity-50 cursor-not-allowed" : ""
//                         }`}
//                         title="Remove Admin"
//                       >
//                         <svg
//                           className="w-5 h-5 text-amber-500"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                           xmlns="http://www.w3.org/2000/svg"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M18.36 6.64a9 9 0 11-12.73 0"
//                           />
//                         </svg>
//                       </button>
//                       <button
//                         onClick={() => removeGroupMember(u.publicId)}
//                         className="p-1 rounded-full hover:bg-zinc-700 transition-colors duration-200"
//                         title="Remove"
//                       >
//                         <svg
//                           className="w-5 h-5 text-red-500"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                           xmlns="http://www.w3.org/2000/svg"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M6 18L18 6M6 6l12 12"
//                           />
//                         </svg>
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               ))}
//               <h4 className="text-sm font-semibold text-amber-400 mt-4">Members</h4>
//               {activeConvObj.participants
//                 .filter((u) => !activeConvObj.admins?.some((admin) => admin.publicId === u.publicId))
//                 .map((u) => (
//                   <div
//                     key={u.publicId}
//                     className="p-2 rounded flex items-center justify-between gap-3 hover:bg-zinc-800 transition-colors duration-200"
//                   >
//                     <div className="flex items-center gap-3">
//                       {profilePic(u, 32)}
//                       <div>
//                         <p className="text-sm font-medium">{u.name}</p>
//                         <span className="text-xs text-zinc-400">{u.role}</span>
//                       </div>
//                     </div>
//                     {me?.publicId !== u.publicId && (
//                       <div className="flex gap-2">
//                         <button
//                           onClick={() => {
//                             if (!u.publicId) {
//                               toast.error("Invalid user ID");
//                               return;
//                             }
//                             setConfirmAction("add");
//                             setConfirmUser(u);
//                             setShowConfirm(true);
//                           }}
//                           className="p-1 rounded-full hover:bg-zinc-700 transition-colors duration-200"
//                           title="Make Admin"
//                         >
//                           <svg
//                             className="w-5 h-5 text-zinc-400"
//                             fill="none"
//                             stroke="currentColor"
//                             viewBox="0 0 24 24"
//                             xmlns="http://www.w3.org/2000/svg"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2}
//                               d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
//                             />
//                           </svg>
//                         </button>
//                         <button
//                           onClick={() => removeGroupMember(u.publicId)}
//                           className="p-1 rounded-full hover:bg-zinc-700 transition-colors duration-200"
//                           title="Remove"
//                         >
//                           <svg
//                             className="w-5 h-5 text-red-500"
//                             fill="none"
//                             stroke="currentColor"
//                             viewBox="0 0 24 24"
//                             xmlns="http://www.w3.org/2000/svg"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2}
//                               d="M6 18L18 6M6 6l12 12"
//                             />
//                           </svg>
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//             </div>
//             <div className="flex gap-2 mt-4">
//               <button
//                 onClick={() => setShowEditGroup(false)}
//                 className="flex-1 bg-zinc-800 text-zinc-200 py-2 rounded hover:bg-zinc-700"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={updateGroupSettings}
//                 className="flex-1 bg-amber-500 text-black py-2 rounded hover:bg-amber-600"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {showConfirm && confirmUser && confirmAction && (
//         <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
//           <div className="bg-zinc-900 p-6 rounded-lg w-80">
//             <h3 className="text-lg font-bold mb-4 text-amber-400">Confirm Action</h3>
//             <p className="mb-4">
//               Are you sure you want to {confirmAction} {confirmUser.name} as admin?
//             </p>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setShowConfirm(false)}
//                 className="flex-1 bg-zinc-800 text-zinc-200 py-2 rounded hover:bg-zinc-700"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleConfirmAdmin}
//                 className="flex-1 bg-amber-500 text-black py-2 rounded hover:bg-amber-600"
//               >
//                 Confirm
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <style jsx global>{`
//         .custom-scrollbar::-webkit-scrollbar {
//           width: 6px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: black;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background-color: #71717a;
//           border-radius: 10px;
//         }
//       `}</style>
//     </div>
//   );
// }











"use client";

import React, { JSX } from "react";
import { useEffect, useState, useRef, memo } from "react";
import useSWR, { mutate } from "swr";
import { socket } from "@/lib/socket";
import { useSession } from "@/lib/hooks/useSession";
import { format, isToday, isYesterday } from "date-fns";
import { Role, ConversationType } from "@/types/enums";
import Image from "next/image";
import { debounce } from "lodash";
import toast from "react-hot-toast";

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.json();
};

// Interfaces for type safety
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
  status?: string;
}

interface Conversation {
  publicId: string;
  type: ConversationType;
  name?: string;
  description?: string;
  profilePic?: string;
  allowAllMessages?: boolean;
  participants: User[];
  admins?: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

// MessageBubble component for rendering individual chat messages
const MessageBubble = memo(({ message, isOwnMessage, isGroup }: { message: Message; isOwnMessage: boolean; isGroup: boolean }) => {
  // Format timestamp for display
  const formatTime = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return format(d, "hh:mm a");
  };

  // Render user profile picture or fallback initials
  const renderProfilePic = (user: User) => {
    if (user.profilePic) {
      return (
        <Image
          src={user.profilePic}
          alt={user.name}
          width={30}
          height={30}
          className="rounded-full"
        />
      );
    }
    return (
      <div
        style={{ width: 30, height: 30 }}
        className="rounded-full bg-amber-500 flex items-center justify-center text-black font-bold"
      >
        {user.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-3`}>
      <div className="max-w-xs">
        {isGroup && !isOwnMessage && (
          <div className="flex items-start">
            <div className="mr-2">{renderProfilePic(message.sender)}</div>
            <div>
              <p className="text-sm font-semibold text-amber-400 mb-1">{message.sender.name}</p>
              <div className="bg-zinc-800 text-white p-2 rounded-lg">
                <p>{message.content}</p>
                <span className="text-xs text-zinc-400 mt-1 block">{formatTime(message.createdAt)}</span>
              </div>
            </div>
          </div>
        )}
        {isGroup && isOwnMessage && (
          <div>
            <p className="text-sm font-semibold text-amber-400 mb-1 text-right">{message.sender.name}</p>
            <div className="bg-amber-500 text-black p-2 rounded-lg">
              <p>{message.content}</p>
              <span className="text-xs text-zinc-600 mt-1 block text-right">{formatTime(message.createdAt)}</span>
            </div>
          </div>
        )}
        {!isGroup && (
          <div
            className={`max-w-xs p-2 rounded-lg ${
              isOwnMessage ? "bg-amber-500 text-black" : "bg-zinc-800 text-white"
            }`}
          >
            <p>{message.content}</p>
            <span className="text-xs text-zinc-400 mt-1 block ${isOwnMessage ? 'text-right' : ''}`">{formatTime(message.createdAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
});
MessageBubble.displayName = "MessageBubble";

// Render user profile picture or initials
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

// Render group profile picture or initials
const groupProfile = (conv: Conversation | undefined, size: number = 40) => {
  if (!conv) return null;
  if (conv.profilePic) {
    return (
      <Image
        src={conv.profilePic}
        alt={conv.name || "Group"}
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
      {conv.name?.charAt(0).toUpperCase() || "G"}
    </div>
  );
};

export default function ChatPage() {
  const { user: me } = useSession();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupProfilePic, setGroupProfilePic] = useState<File | null>(null);
  const [groupProfilePreview, setGroupProfilePreview] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [allowAllMessages, setAllowAllMessages] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"add" | "remove" | null>(null);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);

  const debouncedSetSearchTerm = debounce((value: string) => setSearchTerm(value), 300);
  const debouncedSetUserSearch = debounce((value: string) => setUserSearch(value), 300);

  // Fetch conversations using SWR
  const {
    data: conversations,
    mutate: mutateConversations,
  } = useSWR<Conversation[]>("/api/conversations", fetcher);

  // Fetch messages for the active conversation using SWR
  const {
    data: messages,
    mutate: mutateMessages,
  } = useSWR<Message[]>(
    activeConversation ? `/api/conversations/${activeConversation}/messages` : null,
    fetcher
  );

  // Fetch users for admin user selection using SWR
  const { data: rawUsers, error: usersError } = useSWR("/api/admin/users", fetcher);
  const users: User[] = Array.isArray(rawUsers) ? rawUsers : rawUsers?.users || [];

  // Display error message if fetching users fails
  useEffect(() => {
    if (usersError) {
      console.error("Failed to fetch users:", usersError.message);
      toast.error("Failed to load users. Please try again.");
    }
  }, [usersError]);

  // Handle profile pic preview
  useEffect(() => {
    if (groupProfilePic) {
      const previewUrl = URL.createObjectURL(groupProfilePic);
      setGroupProfilePreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    } else {
      setGroupProfilePreview(null);
    }
  }, [groupProfilePic]);

  // Send a message to the active conversation
  const sendMessage = async (content: string, senderPublicId: string) => {
    if (!activeConversation) throw new Error("No active conversation");
    try {
      const response = await fetch(`/api/conversations/${activeConversation}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content, senderPublicId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }
      const data = await response.json();
      await mutateMessages(); // Revalidate messages
      return data;
    } catch (err) {
      throw new Error((err as Error).message || "Failed to send message");
    }
  };

  // Start a new direct conversation with a user
  const startNewConversation = async (participantPublicId: string) => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ participantPublicId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start conversation");
      }
      const data = await response.json();
      await mutateConversations(); // Revalidate conversations
      return data;
    } catch (err) {
      throw new Error((err as Error).message || "Failed to start conversation");
    }
  };

  // Create a new group conversation
  const createGroupConversation = async (arg: {
    name: string;
    description?: string;
    participantPublicIds: string[];
    profilePic?: string | File;
    adminPublicId?: string;
  }) => {
    try {
      const formData = new FormData();
      formData.append("name", arg.name);
      if (arg.description) formData.append("description", arg.description);
      formData.append("participantPublicIds", JSON.stringify([...arg.participantPublicIds, me?.publicId || ""]));
      if (arg.adminPublicId) formData.append("adminPublicId", arg.adminPublicId);

      // Handle profile picture upload
      if (arg.profilePic) {
        if (arg.profilePic instanceof File) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", arg.profilePic);
          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            credentials: "include",
            body: uploadFormData,
          });
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || "Failed to upload profile picture");
          }
          const uploadData = await uploadResponse.json();
          if (uploadData.url) formData.append("profilePic", uploadData.url);
        } else {
          formData.append("profilePic", arg.profilePic);
        }
      }

      const response = await fetch("/api/conversations/group", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response from /api/conversations/group:", errorData);
        throw new Error(errorData.error || `Failed to create group (Status: ${response.status})`);
      }

      const data = await response.json();
      await mutateConversations(); // Revalidate conversations
      return data.conversation;
    } catch (err) {
      console.error("Error in createGroupConversation:", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      throw new Error(err instanceof Error ? err.message : "Failed to create group");
    }
  };

  // Update group conversation settings
  const updateGroup = async (arg: { name?: string; description?: string; profilePic?: string | File }) => {
    if (!activeConversation) throw new Error("No active conversation");
    try {
      const formData = new FormData();
      if (arg.name) formData.append("name", arg.name);
      if (arg.description) formData.append("description", arg.description);
      if (arg.profilePic) {
        if (arg.profilePic instanceof File) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", arg.profilePic);
          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            credentials: "include",
            body: uploadFormData,
          });
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || "Failed to upload profile picture");
          }
          const uploadData = await uploadResponse.json();
          if (uploadData.url) formData.append("profilePic", uploadData.url);
        } else if (typeof arg.profilePic === "string") {
          formData.append("profilePic", arg.profilePic);
        }
      }

      const response = await fetch(`/api/conversations/group/${activeConversation}`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update group");
      }
      const data = await response.json();
      await mutateConversations(); // Revalidate conversations
      return data.conversation;
    } catch (err) {
      throw new Error((err as Error).message || "Failed to update group");
    }
  };

  // Manage group admin status (add or remove admin)
  const manageGroupAdmin = async (arg: { userPublicId: string; action: "add" | "remove" }) => {
    if (!activeConversation) throw new Error("No active conversation");
    if (!arg.userPublicId) throw new Error("userPublicId is missing");
    try {
      console.log("manageGroupAdmin payload:", arg);
      const response = await fetch(`/api/conversations/group/${activeConversation}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(arg),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to manage admin");
      }
      const data = await response.json();
      await mutateConversations(); // Revalidate conversations
      await mutate(`/api/conversations/${activeConversation}`); // Revalidate active conversation
      toast.success(`User ${arg.action === "add" ? "promoted to" : "removed as"} admin`);
      return data.conversation;
    } catch (err) {
      console.error("manageGroupAdmin error:", (err as Error).message);
      throw new Error((err as Error).message || "Failed to manage admin");
    }
  };

  // Add a member to a group conversation
  const addGroupMember = async (userPublicId: string) => {
    if (!activeConversation) {
      toast.error("No active conversation selected");
      throw new Error("No active conversation");
    }
    if (!userPublicId || typeof userPublicId !== "string") {
      toast.error("Invalid user selected");
      throw new Error("Invalid userPublicId");
    }

    try {
      console.log("Adding group member:", { activeConversation, userPublicId });
      const response = await fetch(`/api/conversations/group/${activeConversation}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userPublicId, action: "add" }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to add member");
        throw new Error(errorData.error || "Failed to add member");
      }
      const data = await response.json();
      await mutateConversations(); // Revalidate conversations
      await mutate(`/api/conversations/${activeConversation}`); // Revalidate active conversation
      toast.success("Member added successfully");
      return data.conversation;
    } catch (err) {
      console.error("Failed to add group member:", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      toast.error((err as Error).message || "Failed to add member");
      throw new Error((err as Error).message || "Failed to add member");
    }
  };

  // Remove a member from a group conversation
  const removeGroupMember = async (userPublicId: string) => {
    if (!activeConversation) throw new Error("No active conversation");
    try {
      const response = await fetch(`/api/conversations/group/${activeConversation}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userPublicId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to remove member");
        throw new Error(errorData.error || "Failed to remove member");
      }
      const data = await response.json();
      await mutateConversations(); // Revalidate conversations
      await mutate(`/api/conversations/${activeConversation}`); // Revalidate active conversation
      toast.success("Member removed successfully");
      return data.conversation;
    } catch (err) {
      console.error("Failed to remove group member:", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      throw new Error((err as Error).message || "Failed to remove member");
    }
  };

  // Toggle messaging permissions for a group
  const toggleMessagingPermissions = async (allowAllMessages: boolean) => {
    if (!activeConversation) throw new Error("No active conversation");
    try {
      const response = await fetch(`/api/conversations/group/${activeConversation}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ allowAllMessages }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update permissions");
      }
      const data = await response.json();
      await mutateConversations(); // Revalidate conversations
      await mutate(`/api/conversations/${activeConversation}`); // Revalidate active conversation
      toast.success("Permissions updated successfully");
      return data.conversation;
    } catch (err) {
      throw new Error((err as Error).message || "Failed to update permissions");
    }
  };

  // Handle Socket.IO events and polling
  useEffect(() => {
    fetch("/api/socket/io", { credentials: "include" })
      .then(() => console.log("Socket.IO server initialization triggered"))
      .catch((err) => console.error("Failed to initialize Socket.IO server:", err.message));

    socket.on("connect", () => setIsSocketConnected(true));
    socket.on("disconnect", () => setIsSocketConnected(false));

    if (me?.publicId) {
      socket.emit("join", { publicId: me.publicId });
    }

    socket.on("message:active", (msg: Message) => {
      if (activeConversation === msg.conversationPublicId) {
        mutateMessages((old = []) => {
          if (old.some((m) => m.publicId === msg.publicId)) return old;
          return [...old, msg];
        }, false);
      }
    });

    socket.on("message:sidebar", (msg: Message | Conversation) => {
      mutateConversations((old = []) => {
        const exists = old.find((c) => c.publicId === msg.publicId || ("conversationPublicId" in msg && c.publicId === msg.conversationPublicId));

        if ("content" in msg) {
          if (exists) {
            return [
              {
                ...exists,
                lastMessage: msg,
                unreadCount:
                  activeConversation === msg.conversationPublicId
                    ? 0
                    : exists.unreadCount + (msg.sender.publicId !== me?.publicId ? 1 : 0),
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
              type: ConversationType.DIRECT,
              participants: [msg.sender],
              lastMessage: msg,
              unreadCount: activeConversation === msg.conversationPublicId ? 0 : 1,
              updatedAt: msg.createdAt,
            },
            ...old,
          ];
        } else {
          if (exists) {
            return [
              {
                ...exists,
                ...msg,
              },
              ...old
                .filter((c) => c.publicId !== msg.publicId)
                .sort(
                  (a, b) =>
                    new Date(b.lastMessage?.createdAt || b.updatedAt).getTime() -
                    new Date(a.lastMessage?.createdAt || a.updatedAt).getTime()
                ),
            ];
          }
          return [msg, ...old];
        }
      }, false);

      if ("publicId" in msg && msg.publicId === activeConversation) {
        mutate(`/api/conversations/${activeConversation}`, undefined, { revalidate: true });
      }
    });

    socket.on("conversation:new", (conv: Conversation) => {
      mutateConversations((old = []) => {
        if (old.some((c) => c.publicId === conv.publicId)) return old;
        return [conv, ...old];
      }, false);
    });

    socket.on("conversation:removed", (data: { conversationId: string }) => {
      if (data.conversationId === activeConversation) {
        setActiveConversation(null);
      }
      mutateConversations((old = []) => old.filter((c) => c.publicId !== data.conversationId), false);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("message:active");
      socket.off("message:sidebar");
      socket.off("conversation:new");
      socket.off("conversation:removed");
    };
  }, [activeConversation, me?.publicId, mutateConversations, mutateMessages]);

  // Poll conversations when socket is disconnected
  useEffect(() => {
    if (!isSocketConnected) {
      const interval = setInterval(() => {
        mutate("/api/conversations");
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isSocketConnected]);

  // Join/leave conversation socket room
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

  // Open a conversation and mark messages as read
  const openConversation = async (publicId: string) => {
    setActiveConversation(publicId);
    try {
      const response = await fetch(`/api/conversations/${publicId}/read`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark messages as read");
      }
      mutateConversations(
        (old = []) =>
          old.map((c) =>
            c.publicId === publicId ? { ...c, unreadCount: 0 } : c
          ),
        false
      );
    } catch (err) {
      console.error("Failed to mark messages as read:", (err as Error).message);
      toast.error((err as Error).message || "Failed to mark messages as read");
    }
  };

  // Start a new direct conversation with a user
  const startConversation = async (userPublicId: string) => {
    try {
      const data = await startNewConversation(userPublicId);
      setActiveConversation(data.conversation.publicId);
      setShowNewChat(false);
      toast.success("Conversation started");
    } catch (err) {
      console.error("Failed to start conversation", (err as Error).message);
      toast.error((err as Error).message);
    }
  };

  // Create a new group conversation
  const createGroup = async () => {
    if (!groupName || selectedUsers.length === 0) {
      toast.error("Group name and at least one participant are required");
      return;
    }
    if (!me?.publicId) {
      toast.error("User session is invalid. Please log in again.");
      return;
    }
    if (selectedUsers.some((id) => !id || typeof id !== "string")) {
      toast.error("One or more selected user IDs are invalid.");
      return;
    }

    try {
      let profilePicUrl: string | undefined;
      if (groupProfilePic) {
        const formData = new FormData();
        formData.append("file", groupProfilePic);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "Failed to upload profile picture");
        }
        const uploadData = await uploadResponse.json();
        if (uploadData.url) profilePicUrl = uploadData.url;
      }

      const participantPublicIds = [me.publicId, ...selectedUsers];
      const conv: Conversation = await createGroupConversation({
        name: groupName,
        description: groupDescription,
        participantPublicIds,
        profilePic: profilePicUrl,
        adminPublicId: me.publicId,
      });
      setGroupName("");
      setGroupDescription("");
      setGroupProfilePic(null);
      setSelectedUsers([]);
      setShowNewChat(false);
      setIsGroupChat(false);
      setActiveConversation(conv.publicId);
      toast.success("Group created successfully");
    } catch (err) {
      console.error("Failed to create group", (err as Error).message);
      toast.error((err as Error).message || "Failed to create group");
    }
  };

  // Update group settings
  const updateGroupSettings = async () => {
    try {
      let profilePicUrl: string | undefined;
      if (groupProfilePic) {
        const maxFileSize = 10 * 1024 * 1024;
        if (groupProfilePic.size > maxFileSize) {
          toast.error("Profile picture exceeds 10MB limit");
          return;
        }

        const formData = new FormData();
        formData.append("file", groupProfilePic);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "Failed to upload profile picture");
        }
        const uploadData = await uploadResponse.json();
        if (uploadData.url) profilePicUrl = uploadData.url;
      }

      await updateGroup({
        name: groupName || undefined,
        description: groupDescription || undefined,
        profilePic: profilePicUrl,
      });
      await toggleMessagingPermissions(allowAllMessages);
      setShowEditGroup(false);
      setGroupName("");
      setGroupDescription("");
      setGroupProfilePic(null);
      toast.success("Group updated successfully");
    } catch (err) {
      console.error("Failed to update group", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      toast.error((err as Error).message || "Failed to update group");
    }
  };

  // Handle confirm admin action
  const handleConfirmAdmin = async () => {
    if (!confirmUser || !confirmAction || !activeConversation) return;
    try {
      await manageGroupAdmin({ userPublicId: confirmUser.publicId, action: confirmAction });
      // Force revalidation of the active conversation
      await mutate(`/api/conversations/${activeConversation}`, undefined, { revalidate: true });
    } catch {
      // Error handled in manageGroupAdmin
    }
    setShowConfirm(false);
    setConfirmUser(null);
    setConfirmAction(null);
  };

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !me || !activeConversation) return;

    const activeConv = conversations?.find((c) => c.publicId === activeConversation);
    if (
      activeConv?.type === ConversationType.GROUP &&
      !activeConv.allowAllMessages &&
      !activeConv.admins?.some((admin) => admin.publicId === me?.publicId)
    ) {
      toast.error("Only admins can send messages in this group");
      return;
    }

    const tempMessage: Message = {
      publicId: `temp-${Date.now()}`,
      conversationPublicId: activeConversation,
      sender: me,
      content: newMessage,
      createdAt: new Date().toISOString(),
      status: "SENT",
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
      const saved: Message = await sendMessage(tempMessage.content, me.publicId);
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
    } catch (err) {
      console.error("Failed to send message:", (err as Error).message);
      mutateMessages((old = []) =>
        old.filter((m) => m.publicId !== tempMessage.publicId)
      );
      mutateConversations((old = []) =>
        old.filter((c) => c.lastMessage?.publicId !== tempMessage.publicId)
      );
      toast.error((err as Error).message);
    }
  };

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter conversations based on search term
  const filteredConversations =
    (conversations ?? []).filter((c) => {
      const conversationName =
        c.type === ConversationType.GROUP
          ? c.name || "Unnamed Group"
          : c.participants?.find((p) => p.publicId !== me?.publicId)?.name || "Unknown";
      return conversationName.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort(
      (a, b) =>
        new Date(b.lastMessage?.createdAt || b.updatedAt).getTime() -
        new Date(a.lastMessage?.createdAt || a.updatedAt).getTime()
    ) || [];

  // Get the active conversation object
  const activeConvObj = conversations?.find(
    (c) => c.publicId === activeConversation
  );

  // Get the chat partner for direct conversations
  const chatPartner =
    activeConvObj?.type === ConversationType.DIRECT
      ? activeConvObj?.participants.find((p) => p.publicId !== me?.publicId) || null
      : null;

  // Filter users for adding to group
  const filteredUsers =
    users?.filter(
      (u) =>
        u.publicId !== me?.publicId &&
        u.name.toLowerCase().includes(userSearch.toLowerCase())
    ) || [];

  // Check if the current user is a group admin
  const isGroupAdmin =
    activeConvObj?.type === ConversationType.GROUP &&
    (activeConvObj.admins?.some((admin) => admin.publicId === me?.publicId) ||
      me?.role === Role.ADMIN);

  // Render messages with date headers
  const renderMessagesWithDates = () => {
    if (!messages) return null;
    const grouped: JSX.Element[] = [];
    let lastDate: string | null = null;

    messages.forEach((m, index) => {
      const messageDate = format(new Date(m.createdAt), "yyyy-MM-dd");
      if (messageDate !== lastDate) {
        let dateLabel = "";
        const dateObj = new Date(m.createdAt);
        if (isToday(dateObj)) {
          dateLabel = "Today";
        } else if (isYesterday(dateObj)) {
          dateLabel = "Yesterday";
        } else {
          dateLabel = format(dateObj, "MMMM d, yyyy");
        }
        grouped.push(
          <div key={`date-${messageDate}`} className="text-center text-zinc-400 text-sm my-4">
            {dateLabel}
          </div>
        );
        lastDate = messageDate;
      }
      grouped.push(
        <MessageBubble
          key={m.publicId || `${m.createdAt}-${index}`}
          message={m}
          isOwnMessage={m.sender?.publicId === me?.publicId}
          isGroup={activeConvObj?.type === ConversationType.GROUP}
        />
      );
    });
    return grouped;
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 relative custom-scrollbar">
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
          <div className="flex gap-2 mb-3">
            <button
              className="flex-1 bg-amber-500 text-black py-2 rounded"
              onClick={() => {
                setShowNewChat(true);
                setIsGroupChat(false);
                setGroupName("");
                setGroupDescription("");
                setGroupProfilePic(null);
                setSelectedUsers([]);
              }}
            >
              New Chat
            </button>
            <button
              className="flex-1 bg-amber-500 text-black py-2 rounded"
              onClick={() => {
                setShowNewChat(true);
                setIsGroupChat(true);
                setGroupName("");
                setGroupDescription("");
                setGroupProfilePic(null);
                setSelectedUsers([]);
              }}
            >
              New Group
            </button>
          </div>
        )}

        <input
          type="text"
          className="w-full mb-3 p-2 rounded bg-zinc-900 text-zinc-100"
          placeholder="Search conversations..."
          onChange={(e) => debouncedSetSearchTerm(e.target.value)}
        />

        {filteredConversations.map((c) => {
          const participant =
            c.type === ConversationType.DIRECT
              ? c.participants?.find((p) => p.publicId !== me?.publicId) || null
              : null;
          const conversationName =
            c.type === ConversationType.GROUP
              ? c.name || "Unnamed Group"
              : participant?.name || "Unknown";
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
              {c.type === ConversationType.GROUP
                ? groupProfile(c, 40)
                : profilePic(participant, 40)}
              <div className="flex-1">
                <p className="font-semibold text-zinc-200">{conversationName}</p>
                <p className="text-xs text-zinc-400 truncate">
                  {c.lastMessage?.content ?? "No messages yet"}
                </p>
              </div>
              <div className="text-xs text-zinc-500 flex flex-col items-end">
                <span>
                  {format(new Date(c.lastMessage?.createdAt || c.updatedAt), "hh:mm a")}
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

      <main className="flex-1 flex flex-col">
        {activeConversation && activeConvObj && (
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-3">
              {activeConvObj.type === ConversationType.GROUP
                ? groupProfile(activeConvObj, 40)
                : profilePic(chatPartner, 40)}
              <div>
                <p className="font-semibold">
                  {activeConvObj.type === ConversationType.GROUP
                    ? activeConvObj.name || "Unnamed Group"
                    : chatPartner?.name || "Unknown"}
                </p>
                <span className="text-xs text-zinc-400">
                  {activeConvObj.type === ConversationType.GROUP
                    ? activeConvObj.description || "Group chat"
                    : chatPartner?.role}
                </span>
              </div>
            </div>
            {activeConvObj.type === ConversationType.GROUP && isGroupAdmin && (
              <button
                className="text-amber-500 hover:text-amber-400 px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600"
                onClick={() => {
                  setShowEditGroup(true);
                  setGroupName(activeConvObj.name || "");
                  setGroupDescription(activeConvObj.description || "");
                  setAllowAllMessages(activeConvObj.allowAllMessages ?? true);
                }}
              >
                Edit
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {renderMessagesWithDates()}
          <div ref={messagesEndRef} />
        </div>

        {activeConversation && activeConvObj && (
          <div className="p-4 border-t border-zinc-800">
            {activeConvObj.type === ConversationType.GROUP &&
            !activeConvObj.allowAllMessages &&
            !activeConvObj.admins?.some((admin) => admin.publicId === me?.publicId) ? (
              <p className="text-center text-zinc-400">Only admins can message in this group</p>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded bg-zinc-900 p-2 outline-none text-zinc-100"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-amber-500 text-black px-4 py-2 rounded hover:bg-amber-600"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {showNewChat && (me?.role === Role.ADMIN || isGroupAdmin) && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-zinc-900 p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4 text-amber-400">
              {isGroupChat ? "Create Group Chat" : "Start New Chat"}
            </h3>
            {usersError && (
              <p className="text-red-500 mb-3">Error loading users. Please try again later.</p>
            )}
            {isGroupChat && (
              <>
                <input
                  type="text"
                  className="w-full mb-3 p-2 rounded bg-zinc-800 text-zinc-100"
                  placeholder="Group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
                <textarea
                  className="w-full mb-3 p-2 rounded bg-zinc-800 text-zinc-100"
                  placeholder="Group description"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                />
                <div className="mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full p-2 rounded bg-zinc-800 text-zinc-100"
                    onChange={(e) => setGroupProfilePic(e.target.files?.[0] || null)}
                  />
                  {groupProfilePreview && (
                    <div className="relative mt-2">
                      <Image
                        src={groupProfilePreview}
                        alt="Profile Preview"
                        width={100}
                        height={100}
                        className="rounded"
                      />
                      <button
                        onClick={() => setGroupProfilePic(null)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            <input
              type="text"
              className="w-full mb-3 p-2 rounded bg-zinc-800 text-zinc-100"
              placeholder="Search users..."
              onChange={(e) => debouncedSetUserSearch(e.target.value)}
            />
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {users.length === 0 && !usersError && (
                <p className="text-zinc-400">No users found.</p>
              )}
              {filteredUsers.map((u) => (
                <div
                  key={u.publicId}
                  className={`p-2 rounded cursor-pointer flex items-center justify-between gap-3 ${
                    isGroupChat && selectedUsers.includes(u.publicId)
                      ? "bg-zinc-800"
                      : "hover:bg-zinc-800"
                  }`}
                  onClick={() =>
                    isGroupChat
                      ? setSelectedUsers((prev) =>
                          prev.includes(u.publicId)
                            ? prev.filter((id) => id !== u.publicId)
                            : [...prev, u.publicId]
                        )
                      : startConversation(u.publicId)
                  }
                >
                  <div className="flex items-center gap-3">
                    {profilePic(u, 32)}
                    <div>
                      <p>{u.name}</p>
                      <span className="text-xs text-zinc-400">{u.role}</span>
                    </div>
                  </div>
                  {isGroupChat && selectedUsers.includes(u.publicId) && (
                    <svg
                      className="w-5 h-5 text-amber-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowNewChat(false);
                  setIsGroupChat(false);
                  setGroupName("");
                  setGroupDescription("");
                  setGroupProfilePic(null);
                  setSelectedUsers([]);
                }}
                className="flex-1 bg-zinc-800 text-zinc-200 py-2 rounded hover:bg-zinc-700"
              >
                Cancel
              </button>
              {isGroupChat && (
                <button
                  onClick={createGroup}
                  className="flex-1 bg-amber-500 text-black py-2 rounded hover:bg-amber-600"
                  disabled={usersError}
                >
                  Create Group
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    {showEditGroup && activeConvObj?.type === ConversationType.GROUP && isGroupAdmin && (
  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-xl w-96 max-h-[90vh] overflow-y-auto custom-scrollbar border border-amber-500/30 shadow-[0_0_15px_rgba(255,193,7,0.3)]">
      <h3 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Group Settings</h3>

      {/* Profile Picture Section */}
      <div className="relative mb-8 flex justify-center">
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-amber-500/50 shadow-[0_0_10px_rgba(255,193,7,0.5)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,193,7,0.7)]">
          {groupProfilePreview || activeConvObj.profilePic ? (
            <Image
              src={groupProfilePreview || activeConvObj.profilePic!}
              alt={activeConvObj.name || "Group"}
              width={112}
              height={112}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center text-3xl font-bold text-amber-400">
              {activeConvObj.name?.charAt(0).toUpperCase() || "G"}
            </div>
          )}
        </div>
        <label
          htmlFor="groupProfileUpload"
          className="absolute bottom-2 right-2 bg-amber-500/20 text-amber-400 p-2 rounded-full cursor-pointer hover:bg-amber-500/40 transition-all duration-300 shadow-[0_0_8px_rgba(255,193,7,0.4)] hover:shadow-[0_0_12px_rgba(255,193,7,0.6)]"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <input
            id="groupProfileUpload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setGroupProfilePic(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      {/* Group Name and Description */}
      <div className="mb-8 space-y-4">
        <input
          type="text"
          className="w-full p-2 rounded-lg bg-zinc-800/50 border border-amber-500/20 text-zinc-100 placeholder-zinc-400 focus:border-amber-400 focus:outline-none transition-all duration-300 shadow-[inset_0_0_4px_rgba(255,193,7,0.1)] hover:shadow-[inset_0_0_6px_rgba(255,193,7,0.2)]"
          placeholder="Group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <textarea
          className="w-full p-2 rounded-lg bg-zinc-800/50 border border-amber-500/20 text-zinc-100 placeholder-zinc-400 focus:border-amber-400 focus:outline-none resize-none h-20 transition-all duration-300 shadow-[inset_0_0_4px_rgba(255,193,7,0.1)] hover:shadow-[inset_0_0_6px_rgba(255,193,7,0.2)]"
          placeholder="Group description"
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
        />
      </div>

      {/* Messaging Permissions Toggle */}
      <div className="mb-8">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={allowAllMessages}
              onChange={(e) => setAllowAllMessages(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-6 h-6 bg-zinc-800/50 border border-amber-500/30 rounded-lg peer-checked:bg-amber-500/80 peer-checked:border-amber-400 flex items-center justify-center transition-all duration-300 shadow-[0_0_4px_rgba(255,193,7,0.2)] hover:shadow-[0_0_8px_rgba(255,193,7,0.4)]">
              {allowAllMessages && (
                <svg
                  className="w-5 h-5 text-black"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-zinc-200 font-medium">Enable messaging for all</span>
        </label>
      </div>

      {/* Add Members Section */}
      <div className="mb-8">
        <input
          type="text"
          className="w-full p-2 rounded-lg bg-zinc-800/50 border border-amber-500/20 text-zinc-100 placeholder-zinc-400 focus:border-amber-400 focus:outline-none transition-all duration-300 shadow-[inset_0_0_4px_rgba(255,193,7,0.1)] hover:shadow-[inset_0_0_6px_rgba(255,193,7,0.2)]"
          placeholder="Search users to add..."
          onChange={(e) => debouncedSetUserSearch(e.target.value)}
        />
        {filteredUsers
          .filter((u) => !activeConvObj.participants.some((p) => p.publicId === u.publicId))
          .map((u) => (
            <div
              key={u.publicId}
              className="p-2 rounded-lg flex items-center justify-between gap-3 hover:bg-zinc-800/70 transition-all duration-300 shadow-[0_0_4px_rgba(255,193,7,0.1)] hover:shadow-[0_0_8px_rgba(255,193,7,0.3)]"
              onClick={() => addGroupMember(u.publicId)}
            >
              <div className="flex items-center gap-3">
                {profilePic(u, 32)}
                <div>
                  <p className="text-sm font-medium text-zinc-200">{u.name}</p>
                  <span className="text-xs text-zinc-400">{u.role}</span>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-amber-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          ))}
      </div>

      {/* Admins and Members Sections */}
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Admins</h4>
          {activeConvObj.admins?.map((u) => (
            <div
              key={u.publicId}
              className="p-2 rounded-lg flex items-center justify-between gap-3 hover:bg-zinc-800/70 transition-all duration-300 shadow-[0_0_4px_rgba(255,193,7,0.1)] hover:shadow-[0_0_8px_rgba(255,193,7,0.3)]"
            >
              <div className="flex items-center gap-3">
                {profilePic(u, 32)}
                <div>
                  <p className="text-sm font-medium text-zinc-200">{u.name}</p>
                  <span className="text-xs text-amber-500">Admin</span>
                </div>
              </div>
              {me?.publicId !== u.publicId && (
                <div className="flex gap-2">
                  <button
                    disabled={activeConvObj.admins?.length === 1}
                    onClick={() => {
                      if (!u.publicId) {
                        toast.error("Invalid user ID");
                        return;
                      }
                      setConfirmAction("remove");
                      setConfirmUser(u);
                      setShowConfirm(true);
                    }}
                    className={`p-1 rounded-full hover:bg-amber-500/20 transition-all duration-300 ${
                      activeConvObj.admins?.length === 1 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    title="Remove Admin"
                  >
                    <svg
                      className="w-5 h-5 text-amber-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.36 6.64a9 9 0 11-12.73 0"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeGroupMember(u.publicId)}
                    className="p-1 rounded-full hover:bg-red-500/20 transition-all duration-300"
                    title="Remove"
                  >
                    <svg
                      className="w-5 h-5 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Members</h4>
          {activeConvObj.participants
            .filter((u) => !activeConvObj.admins?.some((admin) => admin.publicId === u.publicId))
            .map((u) => (
              <div
                key={u.publicId}
                className="p-2 rounded-lg flex items-center justify-between gap-3 hover:bg-zinc-800/70 transition-all duration-300 shadow-[0_0_4px_rgba(255,193,7,0.1)] hover:shadow-[0_0_8px_rgba(255,193,7,0.3)]"
              >
                <div className="flex items-center gap-3">
                  {profilePic(u, 32)}
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{u.name}</p>
                    <span className="text-xs text-zinc-400">{u.role}</span>
                  </div>
                </div>
                {me?.publicId !== u.publicId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!u.publicId) {
                          toast.error("Invalid user ID");
                          return;
                        }
                        setConfirmAction("add");
                        setConfirmUser(u);
                        setShowConfirm(true);
                      }}
                      className="p-1 rounded-full hover:bg-amber-500/20 transition-all duration-300"
                      title="Make Admin"
                    >
                      <svg
                        className="w-5 h-5 text-amber-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeGroupMember(u.publicId)}
                      className="p-1 rounded-full hover:bg-red-500/20 transition-all duration-300"
                      title="Remove"
                    >
                      <svg
                        className="w-5 h-5 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={() => setShowEditGroup(false)}
          className="flex-1 bg-zinc-800/50 text-zinc-200 py-2 rounded-lg hover:bg-zinc-700/70 transition-all duration-300 border border-amber-500/20 shadow-[0_0_6px_rgba(255,193,7,0.2)] hover:shadow-[0_0_10px_rgba(255,193,7,0.4)]"
        >
          Cancel
        </button>
        <button
          onClick={updateGroupSettings}
          className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-black py-2 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-[0_0_10px_rgba(255,193,7,0.5)]"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

      {showConfirm && confirmUser && confirmAction && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-zinc-900 p-6 rounded-lg w-80">
            <h3 className="text-lg font-bold mb-4 text-amber-400">Confirm Action</h3>
            <p className="mb-4">
              Are you sure you want to {confirmAction} {confirmUser.name} as admin?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-zinc-800 text-zinc-200 py-2 rounded hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdmin}
                className="flex-1 bg-amber-500 text-black py-2 rounded hover:bg-amber-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: black;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #71717a;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
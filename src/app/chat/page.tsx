// // 'use client';

// // import useSWR from 'swr';
// // import Link from 'next/link';

// // async function fetcher(url: string) {
// //   const res = await fetch(url);
// //   if (!res.ok) throw new Error('Failed to fetch');
// //   return res.json();
// // }

// // export default function ChatPage() {
// //   const { data, error } = useSWR('/api/chat', fetcher);

// //   if (error) return <div className="p-6">Failed to load conversations</div>;
// //   if (!data) return <div className="p-6">Loading...</div>;

// //   return (
// //     <div className="p-6">
// //       <h1 className="text-2xl font-bold mb-4">Your Conversations</h1>
// //       <ul className="space-y-3">
// //         {data.map(
// //           (conv: {
// //             publicId: string;
// //             messages: { content: string }[];
// //           }) => (
// //             <li
// //               key={conv.publicId}
// //               className="p-3 border border-zinc-700 rounded-lg hover:bg-zinc-800"
// //             >
// //               <Link href={`/chat/${conv.publicId}`} className="block">
// //                 <div className="text-lg font-semibold">
// //                   Conversation {conv.publicId}
// //                 </div>
// //                 <div className="text-zinc-400 text-sm">
// //                   {conv.messages[0]?.content || 'No messages yet'}
// //                 </div>
// //               </Link>
// //             </li>
// //           )
// //         )}
// //       </ul>
// //     </div>
// //   );
// // }


























// 'use client';

// import useSWR, { mutate } from 'swr';
// import Link from 'next/link';
// import { useState } from 'react';

// async function fetcher(url: string) {
//   const res = await fetch(url);
//   if (!res.ok) throw new Error('Failed to fetch');
//   return res.json();
// }

// export default function ChatPage() {
//   const { data, error } = useSWR('/api/chat', fetcher);
//   const [loading, setLoading] = useState(false);

//   const startChatWithAdmin = async () => {
//     try {
//       setLoading(true);

//       // Replace with your actual admin's publicId (you might fetch this from API or config)
//       const adminPublicId = process.env.NEXT_PUBLIC_ADMIN_PUBLIC_ID;

//       if (!adminPublicId) {
//         alert('Admin not available');
//         return;
//       }

//       const res = await fetch('/api/chat', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ participantPublicId: adminPublicId }),
//       });

//       if (!res.ok) throw new Error('Failed to start chat');

//       const conversation = await res.json();

//       // Refresh conversations list
//       mutate('/api/chat');

//       // Redirect to the new conversation
//       window.location.href = `/chat/${conversation.publicId}`;
//     } catch (err) {
//       console.error(err);
//       alert('Error starting chat with admin');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (error) return <div className="p-6">Failed to load conversations</div>;
//   if (!data) return <div className="p-6">Loading...</div>;

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-2xl font-bold">Your Conversations</h1>
//         <button
//           onClick={startChatWithAdmin}
//           disabled={loading}
//           className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg"
//         >
//           {loading ? 'Starting...' : 'Start Chat with Admin'}
//         </button>
//       </div>

//       <ul className="space-y-3">
//         {data.map(
//           (conv: {
//             publicId: string;
//             messages: { content: string }[];
//           }) => (
//             <li
//               key={conv.publicId}
//               className="p-3 border border-zinc-700 rounded-lg hover:bg-zinc-800"
//             >
//               <Link href={`/chat/${conv.publicId}`} className="block">
//                 <div className="text-lg font-semibold">
//                   Conversation {conv.publicId}
//                 </div>
//                 <div className="text-zinc-400 text-sm">
//                   {conv.messages[0]?.content || 'No messages yet'}
//                 </div>
//               </Link>
//             </li>
//           )
//         )}
//       </ul>
//     </div>
//   );
// }




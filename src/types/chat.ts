// src/types/chat.ts

export type Role = 'ADMIN' | 'CUSTOMER' | 'RIDER';

export interface Sender {
  publicId: string;
  name: string;
  role: Role;
}

export interface Message {
  publicId: string;
  content: string;
  createdAt: string;
  sender: Sender;
}

export interface Conversation {
  publicId: string;
  messages: Message[];
  participants: {
    user: {
      name: string;
      role: Role;
      publicId: string;
    };
  }[];
}

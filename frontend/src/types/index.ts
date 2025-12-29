// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

// Card types
export interface Card {
  id: string;
  scryfallId: string;
  name: string;
  setCode: string;
  setName: string;
  imageUrl: string;
  manaCost: string | null;
  typeLine: string | null;
  rarity: string;
  priceEur: number | null;
  priceUsd: number | null;
  priceUpdatedAt: string | null;
}

export type CardCondition =
  | "MINT"
  | "NEAR_MINT"
  | "EXCELLENT"
  | "GOOD"
  | "PLAYED"
  | "POOR";

export const CONDITION_LABELS: Record<CardCondition, string> = {
  MINT: "Mint",
  NEAR_MINT: "Near Mint",
  EXCELLENT: "Excellent",
  GOOD: "Good",
  PLAYED: "Played",
  POOR: "Poor",
};

// Binder types
export interface Binder {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  cards?: BinderCard[];
  _count?: {
    cards: number;
  };
}

export interface BinderCard {
  id: string;
  binderId: string;
  cardId: string;
  quantity: number;
  condition: CardCondition;
  askingPrice: number | null;
  notes: string | null;
  isAvailable: boolean;
  pageNumber: number;
  slotPosition: number;
  createdAt: string;
  updatedAt: string;
  card: Card;
  binder?: Binder;
}

// Conversation types
export interface Conversation {
  id: string;
  buyerId: string;
  sellerId: string;
  binderCardId: string | null;
  createdAt: string;
  updatedAt: string;
  buyer: User;
  seller: User;
  binderCard: BinderCard | null;
  messages: Message[];
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: User;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: Array<{ message: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Scryfall search result
export interface ScryfallCard {
  scryfallId: string;
  name: string;
  setCode: string;
  setName: string;
  imageUrl: string;
  manaCost: string | null;
  typeLine: string | null;
  rarity: string;
  priceEur: string | null;
  priceUsd: string | null;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  displayName: string;
}

export interface AddCardFormData {
  scryfallId: string;
  quantity: number;
  condition: CardCondition;
  askingPrice: number | null;
  notes: string;
}

export interface CreateBinderFormData {
  name: string;
  description: string;
  isPublic: boolean;
}

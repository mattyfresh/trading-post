import axios from "axios";
import type {
  User,
  Binder,
  BinderCard,
  Conversation,
  Message,
  ScryfallCard,
  LoginFormData,
  RegisterFormData,
  AddCardFormData,
  CreateBinderFormData,
} from "../types";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (data: RegisterFormData) => {
    const response = await api.post<{ user: User; token: string }>(
      "/auth/register",
      data
    );
    return response.data;
  },

  login: async (data: LoginFormData) => {
    const response = await api.post<{ user: User; token: string }>(
      "/auth/login",
      data
    );
    return response.data;
  },

  logout: async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("token");
  },

  getMe: async () => {
    const response = await api.get<{ user: User }>("/auth/me");
    return response.data.user;
  },
};

// Users API
export const usersApi = {
  getUser: async (id: string) => {
    const response = await api.get<{ user: User }>(`/users/${id}`);
    return response.data.user;
  },

  updateProfile: async (id: string, data: Partial<User>) => {
    const response = await api.put<{ user: User }>(`/users/${id}`, data);
    return response.data.user;
  },

  getUserBinders: async (id: string) => {
    const response = await api.get<{ binders: Binder[] }>(
      `/users/${id}/binders`
    );
    return response.data.binders;
  },
};

// Cards API (Scryfall)
export const cardsApi = {
  search: async (query: string, page = 1) => {
    const response = await api.get<{
      cards: ScryfallCard[];
      totalCards: number;
      hasMore: boolean;
    }>("/cards/search", { params: { q: query, page } });
    return response.data;
  },

  autocomplete: async (query: string) => {
    const response = await api.get<{ suggestions: string[] }>(
      "/cards/autocomplete",
      {
        params: { q: query },
      }
    );
    return response.data.suggestions;
  },

  getCard: async (scryfallId: string) => {
    const response = await api.get<{ card: ScryfallCard }>(
      `/cards/${scryfallId}`
    );
    return response.data.card;
  },
};

// Binders API
export const bindersApi = {
  getMyBinders: async () => {
    const response = await api.get<{ binders: Binder[] }>("/binders");
    return response.data.binders;
  },

  createBinder: async (data: CreateBinderFormData) => {
    const response = await api.post<{ binder: Binder }>("/binders", data);
    return response.data.binder;
  },

  getBinder: async (id: string) => {
    const response = await api.get<{ binder: Binder; isOwner: boolean }>(
      `/binders/${id}`
    );
    return response.data;
  },

  updateBinder: async (id: string, data: Partial<CreateBinderFormData>) => {
    const response = await api.put<{ binder: Binder }>(`/binders/${id}`, data);
    return response.data.binder;
  },

  deleteBinder: async (id: string) => {
    await api.delete(`/binders/${id}`);
  },

  addCard: async (binderId: string, data: AddCardFormData) => {
    const response = await api.post<{ binderCard: BinderCard }>(
      `/binders/${binderId}/cards`,
      data
    );
    return response.data.binderCard;
  },

  updateCard: async (
    binderId: string,
    cardId: string,
    data: Partial<BinderCard>
  ) => {
    const response = await api.put<{ binderCard: BinderCard }>(
      `/binders/${binderId}/cards/${cardId}`,
      data
    );
    return response.data.binderCard;
  },

  removeCard: async (binderId: string, cardId: string) => {
    await api.delete(`/binders/${binderId}/cards/${cardId}`);
  },

  toggleAvailability: async (binderId: string, cardId: string) => {
    const response = await api.patch<{ binderCard: BinderCard }>(
      `/binders/${binderId}/cards/${cardId}/availability`
    );
    return response.data.binderCard;
  },
};

// Search API
export const searchApi = {
  searchCards: async (params: {
    q?: string;
    set?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get<{
      cards: BinderCard[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>("/search/cards", { params });
    return response.data;
  },

  searchSellers: async (params: {
    q?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get<{
      sellers: (User & { totalAvailableCards: number; binders: Binder[] })[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>("/search/sellers", { params });
    return response.data;
  },

  getFeatured: async () => {
    const response = await api.get<{ featured: BinderCard[] }>(
      "/search/featured"
    );
    return response.data.featured;
  },
};

// Conversations API
export const conversationsApi = {
  getConversations: async () => {
    const response = await api.get<{ conversations: Conversation[] }>(
      "/conversations"
    );
    return response.data.conversations;
  },

  createConversation: async (data: {
    sellerId: string;
    binderCardId?: string;
    message: string;
  }) => {
    const response = await api.post<{ conversation: Conversation }>(
      "/conversations",
      data
    );
    return response.data.conversation;
  },

  getConversation: async (id: string) => {
    const response = await api.get<{ conversation: Conversation }>(
      `/conversations/${id}`
    );
    return response.data.conversation;
  },

  sendMessage: async (conversationId: string, content: string) => {
    const response = await api.post<{ message: Message }>(
      `/conversations/${conversationId}/messages`,
      { content }
    );
    return response.data.message;
  },

  markAsRead: async (conversationId: string) => {
    await api.patch(`/conversations/${conversationId}/read`);
  },

  getUnreadCount: async () => {
    const response = await api.get<{ unreadCount: number }>(
      "/conversations/unread/count"
    );
    return response.data.unreadCount;
  },
};

export default api;

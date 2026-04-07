import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsApi, usersApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { socket } from "../services/socket";
import { Send, MessageCircle } from "lucide-react";
import type { Conversation, Message } from "../types";

export default function Messages() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sellerParam = searchParams.get("seller");
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(id || null);
  const [newMessage, setNewMessage] = useState("");
  const [composeMessage, setComposeMessage] = useState("");

  // If ?seller= is set and we don't already have a conversation open, show compose view
  const [composingSellerId, setComposingSellerId] = useState<string | null>(
    sellerParam && !id ? sellerParam : null,
  );

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: conversationsApi.getConversations,
    refetchInterval: 3000,
  });

  const { data: activeConversation } = useQuery({
    queryKey: ["conversation", selectedConversation],
    queryFn: () => conversationsApi.getConversation(selectedConversation!),
    enabled: !!selectedConversation,
  });

  // Fetch seller info for the compose header
  const { data: composeSeller } = useQuery({
    queryKey: ["user", composingSellerId],
    queryFn: () => usersApi.getUser(composingSellerId!),
    enabled: !!composingSellerId,
  });

  const createConversationMutation = useMutation({
    mutationFn: (data: { sellerId: string; message: string }) =>
      conversationsApi.createConversation(data),
    onSuccess: conv => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setComposingSellerId(null);
      setComposeMessage("");
      setSelectedConversation(conv.id);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => conversationsApi.sendMessage(conversationId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", selectedConversation],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setNewMessage("");
    },
  });

  // Auto-select first conversation if none selected and not composing
  useEffect(() => {
    if (
      !selectedConversation &&
      !composingSellerId &&
      conversations &&
      conversations.length > 0
    ) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation, composingSellerId]);

  // If seller param arrives and we already have a conversation with them, select it
  useEffect(() => {
    if (!sellerParam || !conversations) return;
    const existing = conversations.find(
      c => c.sellerId === sellerParam || c.buyerId === sellerParam,
    );
    if (existing) {
      setComposingSellerId(null);
      setSelectedConversation(existing.id);
    }
  }, [sellerParam, conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  // Listen for real-time messages via socket
  useEffect(() => {
    const handler = ({ conversationId }: { conversationId: string; message: Message }) => {
      // Refresh the active thread if it's the one receiving a message
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      // Always refresh the conversation list so unread badges / previews update
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    socket.on("new_message", handler);
    return () => {
      socket.off("new_message", handler);
    };
  }, [queryClient]);

  const getOtherUser = (conv: Conversation) =>
    conv.buyerId === user?.id ? conv.seller : conv.buyer;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: newMessage,
    });
  };

  const handleStartConversation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeMessage.trim() || !composingSellerId) return;
    createConversationMutation.mutate({
      sellerId: composingSellerId,
      message: composeMessage,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Messages</h1>

      <div
        className="bg-white rounded-lg shadow-md overflow-hidden"
        style={{ height: "70vh" }}
      >
        <div className="flex h-full">
          {/* Conversation List */}
          <div className="w-1/3 border-r overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 skeleton rounded" />
                ))}
              </div>
            ) : conversations && conversations.length > 0 ? (
              conversations.map(conv => {
                const otherUser = getOtherUser(conv);
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv.id);
                      setComposingSellerId(null);
                    }}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedConversation === conv.id && !composingSellerId
                        ? "bg-primary-50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {otherUser.displayName}
                      </span>
                      {!!conv?.unreadCount && (
                        <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    {conv.binderCard && (
                      <p className="text-sm text-gray-500 truncate">
                        Re: {conv.binderCard.card.name}
                      </p>
                    )}
                    {conv.messages[0] && (
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {conv.messages[0].content}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No conversations yet</p>
                <p className="text-sm mt-2">
                  Start a conversation by contacting a seller
                </p>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="flex-1 flex flex-col">
            {/* Compose new conversation */}
            {composingSellerId ? (
              <>
                <div className="p-4 border-b bg-gray-50">
                  <h2 className="font-semibold text-gray-900">
                    New message
                    {composeSeller ? ` to ${composeSeller.displayName}` : ""}
                  </h2>
                </div>
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <p className="text-sm">
                    Send your first message below to start the chat.
                  </p>
                </div>
                <form
                  onSubmit={handleStartConversation}
                  className="p-4 border-t"
                >
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={composeMessage}
                      onChange={e => setComposeMessage(e.target.value)}
                      placeholder={`Message ${composeSeller?.displayName ?? "seller"}…`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={
                        !composeMessage.trim() ||
                        createConversationMutation.isPending
                      }
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : activeConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b bg-gray-50">
                  <h2 className="font-semibold text-gray-900">
                    {getOtherUser(activeConversation).displayName}
                  </h2>
                  {activeConversation.binderCard && (
                    <p className="text-sm text-gray-500">
                      About: {activeConversation.binderCard.card.name}
                    </p>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {activeConversation.messages.map((message: Message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user?.id
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p>{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${message.senderId === user?.id ? "text-primary-200" : "text-gray-500"}`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="submit"
                      disabled={
                        !newMessage.trim() || sendMessageMutation.isPending
                      }
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

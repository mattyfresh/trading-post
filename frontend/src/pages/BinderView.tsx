import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bindersApi } from "../services/api";
import { ChevronLeft, ChevronRight, Plus, MessageCircle } from "lucide-react";
import BinderPage from "../components/binder/BinderPage";
import CardDetailsModal from "../components/binder/CardDetailsModal";
import AddCardModal from "../components/binder/AddCardModal";
import type { BinderCard } from "../types";

export default function BinderView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddCard, setShowAddCard] = useState(false);
  const [clickedCardId, setClickedCardId] = useState<string | null>(null);
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(
    null,
  );

  const { data, isLoading } = useQuery({
    queryKey: ["binder", id],
    queryFn: () => bindersApi.getBinder(id!),
    enabled: !!id,
  });

  const cards: BinderCard[] = data?.binder?.cards || [];

  // Jump to the page containing the highlighted card and flash it
  useEffect(() => {
    if (!highlightId || cards.length === 0) return;
    const target = cards.find((c: BinderCard) => c.id === highlightId);
    if (!target) return;
    setCurrentPage(target.pageNumber);
    setHighlightedCardId(highlightId);
    const timer = setTimeout(() => setHighlightedCardId(null), 2000);
    return () => clearTimeout(timer);
  }, [highlightId, cards.length]);

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ cardId }: { cardId: string }) =>
      bindersApi.toggleAvailability(id!, cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["binder", id] });
    },
  });

  const removeCardMutation = useMutation({
    mutationFn: ({ cardId }: { cardId: string }) =>
      bindersApi.removeCard(id!, cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["binder", id] });
      setClickedCardId(null);
    },
  });

  const addCardMutation = useMutation({
    mutationFn: (data: {
      scryfallId: string;
      quantity: number;
      condition: string;
      askingPrice: number | null;
      notes: string;
    }) => bindersApi.addCard(id!, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["binder", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-96 skeleton rounded-lg" />
      </div>
    );
  }

  if (!data?.binder) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Binder not found</h1>
        <Link
          to="/"
          className="text-primary-600 hover:underline mt-4 inline-block"
        >
          Go back home
        </Link>
      </div>
    );
  }

  const { binder, isOwner } = data;
  const clickedCard = clickedCardId
    ? (cards.find((c: BinderCard) => c.id === clickedCardId) ?? null)
    : null;

  // Group cards by page
  const pageCards = cards.filter(
    (card: BinderCard) => card.pageNumber === currentPage,
  );
  const totalPages = Math.max(1, Math.ceil(cards.length / 9));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{binder.name}</h1>
          {binder.description && (
            <p className="text-gray-600 mt-1">{binder.description}</p>
          )}
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <Link
              to={`/seller/${binder.user?.id}`}
              className="hover:text-primary-600"
            >
              by {binder.user?.displayName}
            </Link>
            <span className="mx-2">•</span>
            <span>{cards.length} cards</span>
          </div>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          {isOwner && (
            <button
              onClick={() => setShowAddCard(true)}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Card
            </button>
          )}
          {!isOwner && binder.user && (
            <Link
              to={`/messages?seller=${binder.user.id}`}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contact Seller
            </Link>
          )}
        </div>
      </div>

      {/* Binder */}
      <div className="bg-slate-200 rounded-xl p-6 shadow-lg">
        <BinderPage
          cards={pageCards}
          pageNumber={currentPage}
          isOwner={isOwner}
          highlightedCardId={highlightedCardId}
          onCardClick={card => setClickedCardId(card.id)}
          onToggleAvailability={card =>
            toggleAvailabilityMutation.mutate({ cardId: card.id })
          }
        />

        {/* Page Navigation */}
        <div className="flex items-center justify-center mt-6 space-x-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-white shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-gray-700 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-white shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Card Details Modal */}
      {clickedCard && (
        <CardDetailsModal
          card={clickedCard}
          seller={binder.user}
          onClose={() => setClickedCardId(null)}
          onToggleAvailability={card =>
            toggleAvailabilityMutation.mutate({ cardId: card.id })
          }
          onRemove={card => removeCardMutation.mutate({ cardId: card.id })}
        />
      )}

      {/* Add Card Modal */}
      {showAddCard && (
        <AddCardModal
          isPending={addCardMutation.isPending}
          onAdd={async data => { await addCardMutation.mutateAsync(data); }}
          onClose={() => setShowAddCard(false)}
        />
      )}
    </div>
  );
}

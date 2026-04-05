import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bindersApi, cardsApi } from "../services/api";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MessageCircle,
  Loader2,
} from "lucide-react";
import BinderPage from "../components/binder/BinderPage";
import { useDebounce } from "../hooks/useDebounce";
import type { BinderCard, ScryfallCard } from "../types";

export default function BinderView() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddCard, setShowAddCard] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ScryfallCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [printings, setPrintings] = useState<ScryfallCard[]>([]);
  const [isFetchingPrintings, setIsFetchingPrintings] = useState(false);
  const [selectedPrinting, setSelectedPrinting] = useState<ScryfallCard | null>(null);
  const [askingPrice, setAskingPrice] = useState("");

  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const handleSelectCard = (card: ScryfallCard) => {
    setSelectedCard(card);
    setSelectedPrinting(card);
    setPrintings([]);
    setIsFetchingPrintings(true);
    cardsApi
      .getPrintings(card.name)
      .then(results => {
        setPrintings(results);
        // Keep selected printing pointing to the same set if it exists in results
        const match = results.find(p => p.scryfallId === card.scryfallId);
        setSelectedPrinting(match ?? results[0] ?? card);
      })
      .catch(() => {
        // If printings fetch fails, just use the originally selected card
        setPrintings([card]);
        setSelectedPrinting(card);
      })
      .finally(() => setIsFetchingPrintings(false));
  };

  useEffect(() => {
    if (debouncedSearchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    cardsApi
      .search(debouncedSearchQuery)
      .then(result => {
        if (!cancelled) setSearchResults(result.cards);
      })
      .catch(error => {
        if (!cancelled) console.error("Search failed:", error);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearchQuery]);

  const { data, isLoading } = useQuery({
    queryKey: ["binder", id],
    queryFn: () => bindersApi.getBinder(id!),
    enabled: !!id,
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ cardId }: { cardId: string }) =>
      bindersApi.toggleAvailability(id!, cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["binder", id] });
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
      setShowAddCard(false);
      setSelectedCard(null);
      setSelectedPrinting(null);
      setPrintings([]);
      setAskingPrice("");
      setSearchQuery("");
      setSearchResults([]);
      setIsSearching(false);
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
  const cards = binder.cards || [];

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
      <div className="bg-amber-900/20 rounded-xl p-6 shadow-lg">
        <BinderPage
          cards={pageCards}
          pageNumber={currentPage}
          isOwner={isOwner}
          onCardClick={card => console.log("Card clicked:", card)}
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

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Card to Binder</h2>

            {/* Search */}
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search for a card..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedCard && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                {searchResults.slice(0, 9).map(card => (
                  <div
                    key={card.scryfallId}
                    onClick={() => handleSelectCard(card)}
                    className="cursor-pointer hover:ring-2 hover:ring-primary-500 rounded-lg overflow-hidden"
                  >
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full aspect-card object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Selected Card Form */}
            {selectedCard && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  addCardMutation.mutate({
                    scryfallId: (selectedPrinting ?? selectedCard).scryfallId,
                    quantity: parseInt(formData.get("quantity") as string) || 1,
                    condition:
                      (formData.get("condition") as string) || "NEAR_MINT",
                    askingPrice: askingPrice !== "" ? parseFloat(askingPrice) : null,
                    notes: (formData.get("notes") as string) || "",
                  });
                }}
              >
                <div className="flex space-x-4 mb-4">
                   <img
                     src={(selectedPrinting ?? selectedCard).imageUrl}
                     alt={(selectedPrinting ?? selectedCard).name}
                     className="w-48 rounded-lg object-contain"
                   />
                   <div className="flex-1 space-y-3">
                     <h3 className="font-semibold">{selectedCard.name}</h3>

                     {/* Set / Printing selector */}
                     <div>
                       <label className="block text-sm font-medium text-gray-700">
                         Set
                       </label>
                       {isFetchingPrintings ? (
                         <div className="flex items-center space-x-2 text-sm text-gray-500">
                           <Loader2 className="w-4 h-4 animate-spin" />
                           <span>Loading printings…</span>
                         </div>
                       ) : (
                         <select
                           className="w-full px-3 py-1 border rounded text-sm"
                           value={(selectedPrinting ?? selectedCard).scryfallId}
                            onChange={e => {
                              const printing = printings.find(
                                p => p.scryfallId === e.target.value
                              );
                              if (printing) {
                                setSelectedPrinting(printing);
                                setAskingPrice("");
                              }
                            }}
                         >
                           {(printings.length > 0 ? printings : [selectedCard]).map(p => (
                             <option key={p.scryfallId} value={p.scryfallId}>
                               {p.setName} ({p.setCode.toUpperCase()})
                             </option>
                           ))}
                         </select>
                       )}
                     </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Quantity
                        </label>
                        <input
                          type="number"
                          name="quantity"
                          defaultValue={1}
                          min={1}
                          max={99}
                          className="w-full px-3 py-1 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Condition
                        </label>
                        <select
                          name="condition"
                          defaultValue="NEAR_MINT"
                          className="w-full px-3 py-1 border rounded"
                        >
                          <option value="MINT">Mint</option>
                          <option value="NEAR_MINT">Near Mint</option>
                          <option value="EXCELLENT">Excellent</option>
                          <option value="GOOD">Good</option>
                          <option value="PLAYED">Played</option>
                          <option value="POOR">Poor</option>
                        </select>
                      </div>
                    </div>

                     <div>
                       <div className="flex items-center justify-between mb-1">
                         <label className="block text-sm font-medium text-gray-700">
                           Asking Price (€)
                         </label>
                         {(selectedPrinting ?? selectedCard).priceEur && (
                           <button
                             type="button"
                             onClick={() =>
                               setAskingPrice(
                                 (selectedPrinting ?? selectedCard).priceEur!
                               )
                             }
                             className="text-xs text-primary-600 hover:text-primary-800 hover:underline"
                           >
                             Use reference (€{(selectedPrinting ?? selectedCard).priceEur})
                           </button>
                         )}
                       </div>
                       <input
                         type="number"
                         name="price"
                         step="0.01"
                         min="0"
                         placeholder="Leave empty for no price"
                         className="w-full px-3 py-1 border rounded"
                         value={askingPrice}
                         onChange={e => setAskingPrice(e.target.value)}
                       />
                     </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCard(null);
                      setSelectedPrinting(null);
                      setPrintings([]);
                      setAskingPrice("");
                      setSearchResults([]);
                    }}
                    className="px-4 py-2 text-gray-600"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={addCardMutation.isPending}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {addCardMutation.isPending ? "Adding..." : "Add to Binder"}
                  </button>
                </div>
              </form>
            )}

            {!selectedCard && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddCard(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { cardsApi } from "../../services/api";
import { useDebounce } from "../../hooks/useDebounce";
import type { ScryfallCard } from "../../types";

interface AddCardModalProps {
  isPending: boolean;
  onAdd: (data: {
    scryfallId: string;
    quantity: number;
    condition: string;
    askingPrice: number | null;
    notes: string;
  }) => Promise<void>;
  onClose: () => void;
}

export default function AddCardModal({
  isPending,
  onAdd,
  onClose,
}: AddCardModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ScryfallCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [printings, setPrintings] = useState<ScryfallCard[]>([]);
  const [isFetchingPrintings, setIsFetchingPrintings] = useState(false);
  const [selectedPrinting, setSelectedPrinting] = useState<ScryfallCard | null>(null);
  const [askingPrice, setAskingPrice] = useState("");
  const [justAdded, setJustAdded] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 400);

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

  const handleSelectCard = (card: ScryfallCard) => {
    setSelectedCard(card);
    setSelectedPrinting(card);
    setPrintings([]);
    setIsFetchingPrintings(true);
    cardsApi
      .getPrintings(card.name)
      .then(results => {
        setPrintings(results);
        const match = results.find(p => p.scryfallId === card.scryfallId);
        setSelectedPrinting(match ?? results[0] ?? card);
      })
      .catch(() => {
        setPrintings([card]);
        setSelectedPrinting(card);
      })
      .finally(() => setIsFetchingPrintings(false));
  };

  const activePrinting = selectedPrinting ?? selectedCard;

  const resetToSearch = (clearSearch = false) => {
    setSelectedCard(null);
    setSelectedPrinting(null);
    setPrintings([]);
    setAskingPrice("");
    if (clearSearch) {
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add Card to Binder</h2>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              if (justAdded) setJustAdded(false);
            }}
            placeholder="Search for a card..."
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
        </div>

        {/* Added confirmation */}
        {justAdded && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Card added! Search for another card to keep adding.
          </div>
        )}

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
        {selectedCard && activePrinting && (
          <form
            onSubmit={async e => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await onAdd({
                scryfallId: activePrinting.scryfallId,
                quantity: parseInt(formData.get("quantity") as string) || 1,
                condition: (formData.get("condition") as string) || "NEAR_MINT",
                askingPrice: askingPrice !== "" ? parseFloat(askingPrice) : null,
                notes: (formData.get("notes") as string) || "",
              });
              resetToSearch(true);
              setJustAdded(true);
            }}
          >
            <div className="flex space-x-4 mb-4">
              <img
                src={activePrinting.imageUrl}
                alt={activePrinting.name}
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
                      value={activePrinting.scryfallId}
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
                    {activePrinting.priceEur && (
                      <button
                        type="button"
                        onClick={() => setAskingPrice(activePrinting.priceEur!)}
                        className="text-xs text-primary-600 hover:text-primary-800 hover:underline"
                      >
                        Use reference (€{activePrinting.priceEur})
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
                onClick={resetToSearch}
                className="px-4 py-2 text-gray-600"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isPending ? "Adding..." : "Add to Binder"}
              </button>
            </div>
          </form>
        )}

        {!selectedCard && (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

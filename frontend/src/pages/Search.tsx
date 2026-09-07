import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchApi } from "../services/api";
import { Search as SearchIcon, User, Folder } from "pixelarticons/react";
import CardGrid from "../components/cards/CardGrid";

type Tab = "cards" | "sellers";

export default function Search() {
  const [tab, setTab] = useState<Tab>("cards");

  // Cards state
  const [cardQuery, setCardQuery] = useState("");
  const [cardSearchTerm, setCardSearchTerm] = useState("");
  const [cardPage, setCardPage] = useState(1);

  // Sellers state
  const [sellerQuery, setSellerQuery] = useState("");
  const [sellerSearchTerm, setSellerSearchTerm] = useState("");
  const [sellerPage, setSellerPage] = useState(1);

  const { data: cardData, isLoading: cardsLoading } = useQuery({
    queryKey: ["searchCards", cardSearchTerm, cardPage],
    queryFn: () => searchApi.searchCards({ q: cardSearchTerm, page: cardPage }),
    enabled: cardSearchTerm.length > 0,
  });

  const { data: sellerData, isLoading: sellersLoading } = useQuery({
    queryKey: ["searchSellers", sellerSearchTerm, sellerPage],
    queryFn: () => searchApi.searchSellers({ q: sellerSearchTerm || undefined, page: sellerPage }),
    enabled: tab === "sellers",
  });

  const handleCardSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCardSearchTerm(cardQuery);
    setCardPage(1);
  };

  const handleSellerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSellerSearchTerm(sellerQuery);
    setSellerPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-lg sm:text-xl text-ink mb-8">Search</h1>

      {/* Tabs */}
      <div className="flex border-b-4 border-ink mb-8">
        <button
          onClick={() => setTab("cards")}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-wide border-b-4 -mb-1 transition-colors ${
            tab === "cards"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Cards
        </button>
        <button
          onClick={() => setTab("sellers")}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-wide border-b-4 -mb-1 transition-colors ${
            tab === "sellers"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Sellers
        </button>
      </div>

      {tab === "cards" ? (
        <>
          {/* Card Search Form */}
          <form onSubmit={handleCardSearch} className="mb-8">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={cardQuery}
                  onChange={(e) => setCardQuery(e.target.value)}
                  placeholder="Search for cards by name..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-ink focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 border-2 border-ink shadow-pixel-sm font-display text-[10px] tracking-wide bg-primary-600 text-white hover:bg-primary-700 active:shadow-none active:translate-x-1 active:translate-y-1 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Card Results */}
          {cardsLoading ? (
            <div className="text-center py-12 text-gray-500">
              <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Searching...</p>
            </div>
          ) : cardData?.cards && cardData.cards.length > 0 ? (
            <>
              <p className="text-gray-600 mb-4">Found {cardData.pagination.total} cards</p>
              <CardGrid cards={cardData.cards} />
              {cardData.pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8 space-x-2">
                  <button
                    onClick={() => setCardPage((p) => Math.max(1, p - 1))}
                    disabled={cardPage === 1}
                    className="px-4 py-2 border-2 border-ink disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {cardPage} of {cardData.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCardPage((p) => p + 1)}
                    disabled={cardPage >= cardData.pagination.totalPages}
                    className="px-4 py-2 border-2 border-ink disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : cardSearchTerm ? (
            <div className="text-center py-12 text-gray-500">
              <p>No cards found for "{cardSearchTerm}"</p>
              <p className="mt-2">Try a different search term</p>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Search for cards to see what's available</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Seller Search Form */}
          <form onSubmit={handleSellerSearch} className="mb-8">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={sellerQuery}
                  onChange={(e) => setSellerQuery(e.target.value)}
                  placeholder="Search sellers by name..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-ink focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 border-2 border-ink shadow-pixel-sm font-display text-[10px] tracking-wide bg-primary-600 text-white hover:bg-primary-700 active:shadow-none active:translate-x-1 active:translate-y-1 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Seller Results */}
          {sellersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 skeleton rounded-lg" />
              ))}
            </div>
          ) : sellerData?.sellers && sellerData.sellers.length > 0 ? (
            <>
              <p className="text-gray-600 mb-4">
                Found {sellerData.pagination.total} seller{sellerData.pagination.total !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellerData.sellers.map((seller) => {
                  const visibleBinders = seller.binders.slice(0, 3);
                  const extraCount = seller.binders.length - visibleBinders.length;
                  return (
                    <Link
                      key={seller.id}
                      to={`/seller/${seller.id}`}
                      className="bg-white border-2 border-ink shadow-pixel-sm p-6 hover:shadow-pixel transition-shadow"
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          {seller.avatarUrl ? (
                            <img
                              src={seller.avatarUrl}
                              alt={seller.displayName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                        <div className="ml-3 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{seller.displayName}</h3>
                          <p className="text-sm text-gray-500">
                            {seller.totalAvailableCards} card{seller.totalAvailableCards !== 1 ? "s" : ""} available
                          </p>
                        </div>
                      </div>
                      {visibleBinders.length > 0 && (
                        <div className="space-y-1">
                          {visibleBinders.map((binder) => (
                            <div key={binder.id} className="flex items-center text-sm text-gray-600">
                              <Folder className="w-4 h-4 mr-2 text-primary-500 flex-shrink-0" />
                              <span className="truncate">{binder.name}</span>
                            </div>
                          ))}
                          {extraCount > 0 && (
                            <p className="text-sm text-gray-400 pl-6">
                              +{extraCount} more binder{extraCount !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
              {sellerData.pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8 space-x-2">
                  <button
                    onClick={() => setSellerPage((p) => Math.max(1, p - 1))}
                    disabled={sellerPage === 1}
                    className="px-4 py-2 border-2 border-ink disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {sellerPage} of {sellerData.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setSellerPage((p) => p + 1)}
                    disabled={sellerPage >= sellerData.pagination.totalPages}
                    className="px-4 py-2 border-2 border-ink disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>
                {sellerSearchTerm
                  ? `No sellers found for "${sellerSearchTerm}"`
                  : "No sellers with available cards found"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

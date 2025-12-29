import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchApi } from "../services/api";
import { Search as SearchIcon, Filter } from "lucide-react";
import CardGrid from "../components/cards/CardGrid";

export default function Search() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["searchCards", searchTerm, page],
    queryFn: () => searchApi.searchCards({ q: searchTerm, page }),
    enabled: searchTerm.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Search Cards</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search for cards by name..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-card skeleton rounded-lg" />
          ))}
        </div>
      ) : data?.cards && data.cards.length > 0 ? (
        <>
          <p className="text-gray-600 mb-4">
            Found {data.pagination.total} cards
          </p>
          <CardGrid cards={data.cards} />

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.pagination.totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : searchTerm ? (
        <div className="text-center py-12 text-gray-500">
          <p>No cards found for "{searchTerm}"</p>
          <p className="mt-2">Try a different search term</p>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Search for cards to see what's available</p>
        </div>
      )}
    </div>
  );
}

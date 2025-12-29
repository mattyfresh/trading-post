import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { searchApi } from "../services/api";
import { Search, ArrowRight } from "lucide-react";
import CardGrid from "../components/cards/CardGrid";

export default function Home() {
  const { data: featured, isLoading } = useQuery({
    queryKey: ["featured"],
    queryFn: searchApi.getFeatured,
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Trade Magic Cards in Stockholm
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Find the cards you need from local sellers. Browse digital
              binders, chat with sellers, and arrange meetups to trade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/search"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Search className="w-5 h-5 mr-2" />
                Search Cards
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-400 transition-colors border border-primary-400"
              >
                Start Selling
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Your Binder</h3>
              <p className="text-gray-600">
                Add cards you want to sell or trade. Set your prices and
                conditions.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse & Search</h3>
              <p className="text-gray-600">
                Find cards from other sellers in Stockholm. Filter by name, set,
                or price.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Meet & Trade</h3>
              <p className="text-gray-600">
                Chat with sellers to arrange a meetup. Trade cards in person
                safely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cards */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Recently Listed</h2>
            <Link
              to="/search"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-card skeleton rounded-lg" />
              ))}
            </div>
          ) : featured && featured.length > 0 ? (
            <CardGrid cards={featured} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No cards listed yet. Be the first to add some!</p>
              <Link
                to="/register"
                className="inline-block mt-4 text-primary-600 hover:underline"
              >
                Create an account to start selling
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            Join the Stockholm MTG community. Create your digital binder and
            start connecting with other players today.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
}

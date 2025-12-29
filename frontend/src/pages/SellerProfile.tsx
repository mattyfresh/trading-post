import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../services/api";
import { User, Folder, MessageCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function SellerProfile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => usersApi.getUser(id!),
    enabled: !!id,
  });

  const { data: binders } = useQuery({
    queryKey: ["userBinders", id],
    queryFn: () => usersApi.getUserBinders(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-48 skeleton rounded-lg mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Seller not found</h1>
        <Link
          to="/"
          className="text-primary-600 hover:underline mt-4 inline-block"
        >
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <User className="w-8 h-8 text-gray-500" />
              )}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {user.displayName}
              </h1>
              <p className="text-gray-500">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {currentUser && currentUser.id !== id && (
            <Link
              to={`/messages?seller=${id}`}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contact
            </Link>
          )}
        </div>
      </div>

      {/* Binders */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Trade Binders</h2>
      {binders && binders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {binders.map(binder => (
            <Link
              key={binder.id}
              to={`/binder/${binder.id}`}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <Folder className="w-8 h-8 text-primary-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {binder.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {binder._count?.cards || 0} cards
                  </p>
                </div>
              </div>
              {binder.description && (
                <p className="mt-3 text-gray-600 text-sm">
                  {binder.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>This seller hasn't created any public binders yet</p>
        </div>
      )}
    </div>
  );
}

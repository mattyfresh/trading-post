import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bindersApi } from "../services/api";
import { Plus, Folder, Trash, Pencil } from "pixelarticons/react";
import type { Binder } from "../types";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBinderName, setNewBinderName] = useState("");
  const [newBinderDescription, setNewBinderDescription] = useState("");

  const { data: binders, isLoading } = useQuery({
    queryKey: ["myBinders"],
    queryFn: bindersApi.getMyBinders,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; isPublic: boolean }) => bindersApi.createBinder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBinders"] });
      setShowCreateModal(false);
      setNewBinderName("");
      setNewBinderDescription("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bindersApi.deleteBinder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBinders"] });
    },
  });

  const handleCreateBinder = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: newBinderName,
      description: newBinderDescription,
      isPublic: true,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-lg sm:text-xl text-ink">My binders</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 border-2 border-ink shadow-pixel-sm font-display text-[10px] tracking-wide bg-primary-600 text-white hover:bg-primary-700 active:shadow-none active:translate-x-1 active:translate-y-1 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Binder
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 skeleton rounded-lg" />
          ))}
        </div>
      ) : binders && binders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {binders.map((binder: Binder) => (
            <div
              key={binder.id}
              className="bg-white border-2 border-ink shadow-pixel-sm p-6 hover:shadow-pixel transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <Folder className="w-8 h-8 text-primary-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{binder.name}</h3>
                    <p className="text-sm text-gray-500">{binder._count?.cards || 0} cards</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/binder/${binder.id}`}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this binder?")) {
                        deleteMutation.mutate(binder.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-danger transition-colors"
                    title="Delete"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {binder.description && <p className="mt-3 text-gray-600 text-sm">{binder.description}</p>}
              <Link
                to={`/binder/${binder.id}`}
                className="mt-4 inline-block text-primary-600 hover:underline text-sm font-medium"
              >
                View Binder →
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No binders yet</h3>
          <p className="text-gray-500 mb-4">Create your first binder to start adding cards</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border-2 border-ink shadow-pixel-sm font-display text-[10px] tracking-wide bg-primary-600 text-white hover:bg-primary-700 active:shadow-none active:translate-x-1 active:translate-y-1"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Binder
          </button>
        </div>
      )}

      {/* Create Binder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-ink shadow-pixel-lg p-6 w-full max-w-md mx-4">
            <h2 className="font-display text-base sm:text-lg text-ink mb-4">Create New Binder</h2>
            <form onSubmit={handleCreateBinder}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Binder Name</label>
                <input
                  type="text"
                  value={newBinderName}
                  onChange={(e) => setNewBinderName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-ink focus:ring-2 focus:ring-primary-500"
                  placeholder="My Trade Binder"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={newBinderDescription}
                  onChange={(e) => setNewBinderDescription(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-ink focus:ring-2 focus:ring-primary-500"
                  placeholder="Cards I'm looking to trade or sell"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-bold uppercase tracking-wide text-xs text-ink hover:text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 border-2 border-ink shadow-pixel-sm font-display text-[10px] tracking-wide bg-primary-600 text-white hover:bg-primary-700 active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50 disabled:active:shadow-pixel-sm disabled:active:translate-x-0 disabled:active:translate-y-0"
                >
                  {createMutation.isPending ? "Creating..." : "Create Binder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

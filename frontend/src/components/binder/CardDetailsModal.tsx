import { useState } from "react";
import { Link } from "react-router-dom";
import { X, MessageCircle, Trash2 } from "lucide-react";
import type { BinderCard, User } from "../../types";
import { CONDITION_LABELS } from "../../types";
import { useAuthStore } from "../../store/authStore";

interface CardDetailsModalProps {
  card: BinderCard;
  seller?: User;
  onClose: () => void;
  onToggleAvailability?: (card: BinderCard) => void;
  onRemove?: (card: BinderCard) => void;
}

export default function CardDetailsModal({
  card,
  seller,
  onClose,
  onToggleAvailability,
  onRemove,
}: CardDetailsModalProps) {
  const currentUser = useAuthStore(state => state.user);
  const isOwner = !!currentUser && currentUser.id === seller?.id;
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{card.card.name}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex space-x-4">
          <img
            src={card.card.imageUrl}
            alt={card.card.name}
            className="w-56 rounded-lg object-contain flex-shrink-0"
          />
          <div className="flex-1 space-y-3 text-sm">
            {/* Set */}
            <div>
              <span className="font-medium text-gray-700">Set</span>
              <p className="text-gray-600 mt-0.5">
                {card.card.setName} ({card.card.setCode.toUpperCase()})
              </p>
            </div>

            {/* Type */}
            {card.card.typeLine && (
              <div>
                <span className="font-medium text-gray-700">Type</span>
                <p className="text-gray-600 mt-0.5">{card.card.typeLine}</p>
              </div>
            )}

            {/* Rarity */}
            <div>
              <span className="font-medium text-gray-700">Rarity</span>
              <p className="capitalize text-gray-600 mt-0.5">{card.card.rarity}</p>
            </div>

            {/* Condition */}
            <div>
              <span className="font-medium text-gray-700">Condition</span>
              <p className="text-gray-600 mt-0.5">
                {CONDITION_LABELS[card.condition]}
              </p>
            </div>

            {/* Quantity */}
            <div>
              <span className="font-medium text-gray-700">Quantity</span>
              <p className="text-gray-600 mt-0.5">{card.quantity}</p>
            </div>

            {/* Asking price */}
            <div>
              <span className="font-medium text-gray-700">Asking Price</span>
              <p className="text-gray-600 mt-0.5">
                {card.askingPrice != null
                  ? `€${card.askingPrice.toFixed(2)}`
                  : "Not listed"}
              </p>
            </div>

            {/* Market price */}
            {card.card.priceEur != null && (
              <div>
                <span className="font-medium text-gray-700">
                  Market Price (€)
                </span>
                <p className="text-gray-600 mt-0.5">
                  €{card.card.priceEur.toFixed(2)}
                </p>
              </div>
            )}

            {/* Notes */}
            {card.notes && (
              <div>
                <span className="font-medium text-gray-700">Notes</span>
                <p className="text-gray-600 mt-0.5">{card.notes}</p>
              </div>
            )}

            {/* Availability */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Status</span>
                {isOwner && (
                  <button
                    onClick={() => onToggleAvailability?.(card)}
                    className="text-xs text-primary-600 hover:text-primary-800 hover:underline"
                  >
                    {card.isAvailable ? "Mark as sold" : "Mark as available"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                    card.isAvailable
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {card.isAvailable ? "Available" : "Sold"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-5">
          {isOwner ? (
            confirmDelete ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Remove this card permanently?</span>
                <button
                  onClick={() => onRemove?.(card)}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                >
                  Yes, remove
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Remove from binder
              </button>
            )
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3">
            {!isOwner && seller && (
              <Link
                to={`/messages?seller=${seller.id}`}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Seller
              </Link>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 text-sm hover:bg-gray-100 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

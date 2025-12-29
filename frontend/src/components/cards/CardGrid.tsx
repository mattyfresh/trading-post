import { Link } from "react-router-dom";
import type { BinderCard } from "../../types";
import { CONDITION_LABELS } from "../../types";

interface CardGridProps {
  cards: BinderCard[];
  showSeller?: boolean;
  onCardClick?: (card: BinderCard) => void;
}

export default function CardGrid({
  cards,
  showSeller = true,
  onCardClick,
}: CardGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {cards.map(binderCard => (
        <div
          key={binderCard.id}
          className={`group relative ${
            !binderCard.isAvailable ? "opacity-60" : ""
          }`}
        >
          {/* Card Image */}
          <div
            className="aspect-card rounded-lg overflow-hidden bg-gray-200 card-hover cursor-pointer card-sleeve"
            onClick={() => onCardClick?.(binderCard)}
          >
            <img
              src={binderCard.card.imageUrl}
              alt={binderCard.card.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Unavailable overlay */}
            {!binderCard.isAvailable && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-bold text-sm">SOLD</span>
              </div>
            )}

            {/* Hover overlay */}
            {binderCard.isAvailable && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end">
                <div className="w-full p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium truncate">
                    {binderCard.card.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Card Info */}
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {binderCard.card.name}
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">
                {CONDITION_LABELS[binderCard.condition]}
              </span>
              {binderCard.askingPrice && (
                <span className="text-sm font-semibold text-primary-600">
                  €{binderCard.askingPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Seller info */}
            {showSeller && binderCard.binder?.user && (
              <Link
                to={`/seller/${binderCard.binder.user.id}`}
                className="text-xs text-gray-500 hover:text-primary-600 mt-1 block"
              >
                by {binderCard.binder.user.displayName}
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

import type { BinderCard } from "../../types";
import { CONDITION_LABELS } from "../../types";

interface BinderPageProps {
  cards: BinderCard[];
  pageNumber: number;
  isOwner?: boolean;
  onCardClick?: (card: BinderCard) => void;
  onToggleAvailability?: (card: BinderCard) => void;
}

export default function BinderPage({
  cards,
  pageNumber,
  isOwner = false,
  onCardClick,
  onToggleAvailability,
}: BinderPageProps) {
  return (
    <div className="binder-page rounded-lg p-4 shadow-inner">
      {/* Page number */}
      <div className="text-center text-sm text-slate-400 mb-2">
        Page {pageNumber}
      </div>

      {/* Card grid — only filled slots */}
      <div className="grid grid-cols-3 gap-3">
        {cards.map(binderCard => (
          <div
            key={binderCard.id}
            className="aspect-card bg-white/60 rounded-lg border border-slate-300 flex items-center justify-center overflow-hidden"
          >
            <div
              className={`relative w-full h-full group ${
                !binderCard.isAvailable ? "opacity-60" : ""
              }`}
            >
              {/* Card Image */}
              <img
                src={binderCard.card.imageUrl}
                alt={binderCard.card.name}
                className="w-full h-full object-cover rounded-md cursor-pointer card-hover"
                onClick={() => onCardClick?.(binderCard)}
                loading="lazy"
              />

              {/* Card sleeve overlay */}
              <div className="absolute inset-0 card-sleeve pointer-events-none rounded-md" />

              {/* Unavailable overlay */}
              {!binderCard.isAvailable && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md">
                  <span className="text-white font-bold text-xs">SOLD</span>
                </div>
              )}

              {/* Hover info */}
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-md">
                <p className="text-white text-xs font-medium truncate">
                  {binderCard.card.name}
                </p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white/80 text-xs">
                    {CONDITION_LABELS[binderCard.condition]}
                  </span>
                  {binderCard.askingPrice && (
                    <span className="text-white font-semibold text-xs">
                      €{binderCard.askingPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Owner controls */}
              {isOwner && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onToggleAvailability?.(binderCard);
                  }}
                  title={
                    binderCard.isAvailable
                      ? "Click to mark as sold"
                      : "Click to mark as available"
                  }
                  className={`absolute top-1 right-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    binderCard.isAvailable
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-gray-500 text-white hover:bg-gray-600"
                  }`}
                >
                  {binderCard.isAvailable ? "Available" : "Sold"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

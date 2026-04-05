// Scryfall API Service
// API Documentation: https://scryfall.com/docs/api

const SCRYFALL_BASE_URL = "https://api.scryfall.com";

// Rate limiting: Scryfall asks for 50-100ms between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  set_name: string;
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    png: string;
    art_crop: string;
    border_crop: string;
  };
  card_faces?: Array<{
    image_uris?: {
      small: string;
      normal: string;
      large: string;
    };
  }>;
  mana_cost?: string;
  type_line?: string;
  rarity: string;
  prices: {
    usd?: string;
    usd_foil?: string;
    eur?: string;
    eur_foil?: string;
  };
}

export interface ScryfallSearchResult {
  object: string;
  total_cards: number;
  has_more: boolean;
  next_page?: string;
  data: ScryfallCard[];
}

// Get the best image URL for a card (handles double-faced cards)
export function getCardImageUrl(card: ScryfallCard): string {
  if (card.image_uris) {
    return card.image_uris.normal;
  }
  // For double-faced cards, use the front face
  if (card.card_faces && card.card_faces[0]?.image_uris) {
    return card.card_faces[0].image_uris.normal;
  }
  // Fallback to Scryfall's card back image
  return "https://cards.scryfall.io/normal/back.jpg";
}

// Search for cards by name
export async function searchCards(
  query: string,
  page: number = 1
): Promise<ScryfallSearchResult> {
  await delay(100); // Rate limiting

  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
  });

  const response = await fetch(`${SCRYFALL_BASE_URL}/cards/search?${params}`);

  if (!response.ok) {
    if (response.status === 404) {
      // No cards found
      return {
        object: "list",
        total_cards: 0,
        has_more: false,
        data: [],
      };
    }
    throw new Error(`Scryfall API error: ${response.status}`);
  }

  return response.json();
}

// Get a specific card by Scryfall ID
export async function getCardById(
  scryfallId: string
): Promise<ScryfallCard | null> {
  await delay(100); // Rate limiting

  const response = await fetch(`${SCRYFALL_BASE_URL}/cards/${scryfallId}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Scryfall API error: ${response.status}`);
  }

  return response.json();
}

// Autocomplete card names (for search suggestions)
export async function autocompleteCardName(query: string): Promise<string[]> {
  await delay(50); // Rate limiting (autocomplete is lighter)

  const params = new URLSearchParams({ q: query });
  const response = await fetch(
    `${SCRYFALL_BASE_URL}/cards/autocomplete?${params}`
  );

  if (!response.ok) {
    return [];
  }

  const result = await response.json();
  return result.data || [];
}

// Get all printings of a card by exact name (across all sets)
export async function getCardPrintings(
  name: string
): Promise<ScryfallCard[]> {
  await delay(100); // Rate limiting

  // Use exact name search with unique:prints to get one result per printing
  const params = new URLSearchParams({
    q: `!"${name}"`,
    unique: "prints",
    order: "released",
    dir: "asc",
  });

  const response = await fetch(`${SCRYFALL_BASE_URL}/cards/search?${params}`);

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Scryfall API error: ${response.status}`);
  }

  const result: ScryfallSearchResult = await response.json();
  return result.data;
}

// Get random card (useful for featured cards)
export async function getRandomCard(): Promise<ScryfallCard> {
  await delay(100);

  const response = await fetch(`${SCRYFALL_BASE_URL}/cards/random`);

  if (!response.ok) {
    throw new Error(`Scryfall API error: ${response.status}`);
  }

  return response.json();
}

// Transform Scryfall card to our database format
export function transformScryfallCard(card: ScryfallCard) {
  return {
    scryfallId: card.id,
    name: card.name,
    setCode: card.set,
    setName: card.set_name,
    imageUrl: getCardImageUrl(card),
    manaCost: card.mana_cost || null,
    typeLine: card.type_line || null,
    rarity: card.rarity,
    priceEur: card.prices.eur ? parseFloat(card.prices.eur) : null,
    priceUsd: card.prices.usd ? parseFloat(card.prices.usd) : null,
    priceUpdatedAt: new Date(),
  };
}

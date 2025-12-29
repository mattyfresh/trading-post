import { Router, Request, Response } from "express";
import { prisma } from "../index.js";
import {
  searchCards,
  getCardById,
  autocompleteCardName,
  transformScryfallCard,
} from "../services/scryfall.js";

const router = Router();

// GET /api/cards/search?q=query - Search Scryfall for cards
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { q, page = "1" } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    const result = await searchCards(q, parseInt(page as string, 10));

    // Transform cards to our format
    const cards = result.data.map(card => ({
      scryfallId: card.id,
      name: card.name,
      setCode: card.set,
      setName: card.set_name,
      imageUrl:
        card.image_uris?.normal ||
        card.card_faces?.[0]?.image_uris?.normal ||
        "",
      manaCost: card.mana_cost,
      typeLine: card.type_line,
      rarity: card.rarity,
      priceEur: card.prices.eur,
      priceUsd: card.prices.usd,
    }));

    res.json({
      cards,
      totalCards: result.total_cards,
      hasMore: result.has_more,
    });
  } catch (error) {
    console.error("Card search error:", error);
    res.status(500).json({ error: "Failed to search cards" });
  }
});

// GET /api/cards/autocomplete?q=query - Autocomplete card names
router.get("/autocomplete", async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string" || q.length < 2) {
      res.json({ suggestions: [] });
      return;
    }

    const suggestions = await autocompleteCardName(q);
    res.json({ suggestions });
  } catch (error) {
    console.error("Autocomplete error:", error);
    res.status(500).json({ error: "Failed to get suggestions" });
  }
});

// GET /api/cards/:scryfallId - Get card details (from cache or Scryfall)
router.get("/:scryfallId", async (req: Request, res: Response) => {
  try {
    const { scryfallId } = req.params;

    // First, check if we have this card in our database
    let card = await prisma.card.findUnique({
      where: { scryfallId },
    });

    // If not in database or price is stale (older than 24 hours), fetch from Scryfall
    const priceStaleThreshold = 24 * 60 * 60 * 1000; // 24 hours
    const isPriceStale = card?.priceUpdatedAt
      ? Date.now() - card.priceUpdatedAt.getTime() > priceStaleThreshold
      : true;

    if (!card || isPriceStale) {
      const scryfallCard = await getCardById(scryfallId);

      if (!scryfallCard) {
        res.status(404).json({ error: "Card not found" });
        return;
      }

      const cardData = transformScryfallCard(scryfallCard);

      // Upsert the card in our database
      card = await prisma.card.upsert({
        where: { scryfallId },
        update: {
          priceEur: cardData.priceEur,
          priceUsd: cardData.priceUsd,
          priceUpdatedAt: cardData.priceUpdatedAt,
        },
        create: cardData,
      });
    }

    res.json({ card });
  } catch (error) {
    console.error("Get card error:", error);
    res.status(500).json({ error: "Failed to get card" });
  }
});

export default router;

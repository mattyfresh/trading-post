import { Router, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../index.js";
import { AuthRequest, optionalAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/search/cards - Search all available cards across sellers
router.get("/cards", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      q, // Card name search
      set, // Set code filter
      minPrice, // Minimum asking price
      maxPrice, // Maximum asking price
      condition, // Card condition filter
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50);
    const skip = (pageNum - 1) * limitNum;

    // SQLite doesn't support mode: "insensitive", so we rely on LIKE (contains) being
    // case-insensitive by default.
    const cardWhere: Prisma.CardWhereInput = {};
    if (q && typeof q === "string") {
      cardWhere.name = { contains: q };
    }
    if (set && typeof set === "string") {
      cardWhere.setCode = set.toLowerCase();
    }

    const priceWhere: Prisma.FloatNullableFilter = {};
    if (minPrice) priceWhere.gte = parseFloat(minPrice as string);
    if (maxPrice) priceWhere.lte = parseFloat(maxPrice as string);

    const where: Prisma.BinderCardWhereInput = {
      isAvailable: true,
      binder: {
        isPublic: true,
        // Filter out the requester's own cards, if they're logged in.
        ...(req.userId ? { userId: { not: req.userId } } : {}),
      },
      ...(Object.keys(cardWhere).length > 0 ? { card: cardWhere } : {}),
      ...(Object.keys(priceWhere).length > 0 ? { askingPrice: priceWhere } : {}),
      ...(condition && typeof condition === "string" ? { condition: condition.toUpperCase() } : {}),
    };

    // Get total count
    const total = await prisma.binderCard.count({ where });

    // Get cards with pagination
    const cards = await prisma.binderCard.findMany({
      where,
      include: {
        card: true,
        binder: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: limitNum,
    });

    res.json({
      cards,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Search cards error:", error);
    res.status(500).json({ error: "Failed to search cards" });
  }
});

// GET /api/search/sellers - Search sellers
router.get("/sellers", async (req: AuthRequest, res: Response) => {
  try {
    const { q, page = "1", limit = "20" } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.UserWhereInput = {
      binders: {
        some: {
          isPublic: true,
          cards: {
            some: {
              isAvailable: true,
            },
          },
        },
      },
    };

    if (q && typeof q === "string") {
      where.displayName = {
        contains: q,
      };
    }

    const total = await prisma.user.count({ where });

    const sellers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        binders: {
          where: { isPublic: true },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                cards: {
                  where: { isAvailable: true },
                },
              },
            },
          },
        },
      },
      skip,
      take: limitNum,
    });

    // Calculate total available cards per seller
    const sellersWithCardCount = sellers.map((seller) => ({
      ...seller,
      totalAvailableCards: seller.binders.reduce((sum, binder) => sum + binder._count.cards, 0),
    }));

    res.json({
      sellers: sellersWithCardCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Search sellers error:", error);
    res.status(500).json({ error: "Failed to search sellers" });
  }
});

// GET /api/search/featured - Get featured/recent listings
router.get("/featured", async (req: AuthRequest, res: Response) => {
  try {
    const recentCards = await prisma.binderCard.findMany({
      where: {
        isAvailable: true,
        binder: {
          isPublic: true,
        },
      },
      include: {
        card: true,
        binder: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    res.json({ featured: recentCards });
  } catch (error) {
    console.error("Get featured error:", error);
    res.status(500).json({ error: "Failed to get featured cards" });
  }
});

export default router;

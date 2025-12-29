import { Router, Request, Response } from "express";
import { prisma } from "../index.js";

const router = Router();

// GET /api/search/cards - Search all available cards across sellers
router.get("/cards", async (req: Request, res: Response) => {
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

    // Build where clause
    const where: any = {
      isAvailable: true,
      binder: {
        isPublic: true,
      },
    };

    // Card name search (SQLite doesn't support mode: "insensitive", so we use LIKE which is case-insensitive by default)
    if (q && typeof q === "string") {
      where.card = {
        name: {
          contains: q,
        },
      };
    }

    // Set filter
    if (set && typeof set === "string") {
      where.card = {
        ...where.card,
        setCode: set.toLowerCase(),
      };
    }

    // Price filters
    if (minPrice) {
      where.askingPrice = {
        ...where.askingPrice,
        gte: parseFloat(minPrice as string),
      };
    }
    if (maxPrice) {
      where.askingPrice = {
        ...where.askingPrice,
        lte: parseFloat(maxPrice as string),
      };
    }

    // Condition filter
    if (condition && typeof condition === "string") {
      where.condition = condition.toUpperCase();
    }

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
router.get("/sellers", async (req: Request, res: Response) => {
  try {
    const { q, page = "1", limit = "20" } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
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
    const sellersWithCardCount = sellers.map(seller => ({
      ...seller,
      totalAvailableCards: seller.binders.reduce(
        (sum, binder) => sum + binder._count.cards,
        0
      ),
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
router.get("/featured", async (req: Request, res: Response) => {
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

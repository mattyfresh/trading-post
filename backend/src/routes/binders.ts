import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index.js";
import {
  authenticateToken,
  optionalAuth,
  AuthRequest,
} from "../middleware/auth.js";
import { getCardById, transformScryfallCard } from "../services/scryfall.js";

const router = Router();

// Validation schemas
const createBinderSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
});

const updateBinderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  isPublic: z.boolean().optional(),
});

const addCardSchema = z.object({
  scryfallId: z.string().min(1, "Scryfall ID is required"),
  quantity: z.number().int().min(1).max(99).default(1),
  condition: z
    .enum(["MINT", "NEAR_MINT", "EXCELLENT", "GOOD", "PLAYED", "POOR"])
    .default("NEAR_MINT"),
  askingPrice: z.number().positive().optional().nullable(),
  notes: z.string().max(500).optional(),
  pageNumber: z.number().int().min(1).optional(),
  slotPosition: z.number().int().min(0).max(8).optional(),
});

const updateCardSchema = z.object({
  quantity: z.number().int().min(1).max(99).optional(),
  condition: z
    .enum(["MINT", "NEAR_MINT", "EXCELLENT", "GOOD", "PLAYED", "POOR"])
    .optional(),
  askingPrice: z.number().positive().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  isAvailable: z.boolean().optional(),
  pageNumber: z.number().int().min(1).optional(),
  slotPosition: z.number().int().min(0).max(8).optional(),
});

// GET /api/binders - Get current user's binders
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const binders = await prisma.binder.findMany({
      where: { userId: req.userId },
      include: {
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ binders });
  } catch (error) {
    console.error("Get binders error:", error);
    res.status(500).json({ error: "Failed to get binders" });
  }
});

// POST /api/binders - Create new binder
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const validation = createBinderSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.errors,
      });
      return;
    }

    const binder = await prisma.binder.create({
      data: {
        ...validation.data,
        userId: req.userId!,
      },
    });

    res.status(201).json({ binder });
  } catch (error) {
    console.error("Create binder error:", error);
    res.status(500).json({ error: "Failed to create binder" });
  }
});

// GET /api/binders/:id - Get binder with cards
router.get("/:id", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const binder = await prisma.binder.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        cards: {
          include: {
            card: true,
          },
          orderBy: [{ pageNumber: "asc" }, { slotPosition: "asc" }],
        },
      },
    });

    if (!binder) {
      res.status(404).json({ error: "Binder not found" });
      return;
    }

    // Check if user can view this binder
    const isOwner = req.userId === binder.userId;
    if (!binder.isPublic && !isOwner) {
      res.status(403).json({ error: "This binder is private" });
      return;
    }

    res.json({ binder, isOwner });
  } catch (error) {
    console.error("Get binder error:", error);
    res.status(500).json({ error: "Failed to get binder" });
  }
});

// PUT /api/binders/:id - Update binder
router.put(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check ownership
      const existingBinder = await prisma.binder.findUnique({
        where: { id },
      });

      if (!existingBinder) {
        res.status(404).json({ error: "Binder not found" });
        return;
      }

      if (existingBinder.userId !== req.userId) {
        res.status(403).json({ error: "Not authorized to update this binder" });
        return;
      }

      const validation = updateBinderSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors,
        });
        return;
      }

      const binder = await prisma.binder.update({
        where: { id },
        data: validation.data,
      });

      res.json({ binder });
    } catch (error) {
      console.error("Update binder error:", error);
      res.status(500).json({ error: "Failed to update binder" });
    }
  }
);

// DELETE /api/binders/:id - Delete binder
router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check ownership
      const existingBinder = await prisma.binder.findUnique({
        where: { id },
      });

      if (!existingBinder) {
        res.status(404).json({ error: "Binder not found" });
        return;
      }

      if (existingBinder.userId !== req.userId) {
        res.status(403).json({ error: "Not authorized to delete this binder" });
        return;
      }

      await prisma.binder.delete({
        where: { id },
      });

      res.json({ message: "Binder deleted successfully" });
    } catch (error) {
      console.error("Delete binder error:", error);
      res.status(500).json({ error: "Failed to delete binder" });
    }
  }
);

// POST /api/binders/:id/cards - Add card to binder
router.post(
  "/:id/cards",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check ownership
      const binder = await prisma.binder.findUnique({
        where: { id },
      });

      if (!binder) {
        res.status(404).json({ error: "Binder not found" });
        return;
      }

      if (binder.userId !== req.userId) {
        res
          .status(403)
          .json({ error: "Not authorized to add cards to this binder" });
        return;
      }

      const validation = addCardSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors,
        });
        return;
      }

      const { scryfallId, pageNumber, slotPosition, ...cardData } =
        validation.data;

      // Get or create the card in our database
      let card = await prisma.card.findUnique({
        where: { scryfallId },
      });

      if (!card) {
        // Fetch from Scryfall and create
        const scryfallCard = await getCardById(scryfallId);

        if (!scryfallCard) {
          res.status(404).json({ error: "Card not found on Scryfall" });
          return;
        }

        card = await prisma.card.create({
          data: transformScryfallCard(scryfallCard),
        });
      }

      // Find the next available slot if not specified
      let finalPageNumber = pageNumber;
      let finalSlotPosition = slotPosition;

      if (finalPageNumber === undefined || finalSlotPosition === undefined) {
        // Get the highest page and slot
        const lastCard = await prisma.binderCard.findFirst({
          where: { binderId: id },
          orderBy: [{ pageNumber: "desc" }, { slotPosition: "desc" }],
        });

        if (lastCard) {
          if (lastCard.slotPosition < 8) {
            finalPageNumber = lastCard.pageNumber;
            finalSlotPosition = lastCard.slotPosition + 1;
          } else {
            finalPageNumber = lastCard.pageNumber + 1;
            finalSlotPosition = 0;
          }
        } else {
          finalPageNumber = 1;
          finalSlotPosition = 0;
        }
      }

      // Add card to binder
      const binderCard = await prisma.binderCard.create({
        data: {
          binderId: id,
          cardId: card.id,
          pageNumber: finalPageNumber,
          slotPosition: finalSlotPosition,
          ...cardData,
        },
        include: {
          card: true,
        },
      });

      res.status(201).json({ binderCard });
    } catch (error) {
      console.error("Add card error:", error);
      res.status(500).json({ error: "Failed to add card" });
    }
  }
);

// PUT /api/binders/:id/cards/:cardId - Update card in binder
router.put(
  "/:id/cards/:cardId",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id, cardId } = req.params;

      // Check ownership
      const binderCard = await prisma.binderCard.findUnique({
        where: { id: cardId },
        include: { binder: true },
      });

      if (!binderCard) {
        res.status(404).json({ error: "Card not found in binder" });
        return;
      }

      if (binderCard.binder.userId !== req.userId) {
        res.status(403).json({ error: "Not authorized to update this card" });
        return;
      }

      const validation = updateCardSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors,
        });
        return;
      }

      const updatedCard = await prisma.binderCard.update({
        where: { id: cardId },
        data: validation.data,
        include: { card: true },
      });

      res.json({ binderCard: updatedCard });
    } catch (error) {
      console.error("Update card error:", error);
      res.status(500).json({ error: "Failed to update card" });
    }
  }
);

// DELETE /api/binders/:id/cards/:cardId - Remove card from binder
router.delete(
  "/:id/cards/:cardId",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id, cardId } = req.params;

      // Check ownership
      const binderCard = await prisma.binderCard.findUnique({
        where: { id: cardId },
        include: { binder: true },
      });

      if (!binderCard) {
        res.status(404).json({ error: "Card not found in binder" });
        return;
      }

      if (binderCard.binder.userId !== req.userId) {
        res.status(403).json({ error: "Not authorized to remove this card" });
        return;
      }

      await prisma.binderCard.delete({
        where: { id: cardId },
      });

      res.json({ message: "Card removed from binder" });
    } catch (error) {
      console.error("Remove card error:", error);
      res.status(500).json({ error: "Failed to remove card" });
    }
  }
);

// PATCH /api/binders/:id/cards/:cardId/availability - Toggle card availability
router.patch(
  "/:id/cards/:cardId/availability",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id, cardId } = req.params;

      // Check ownership
      const binderCard = await prisma.binderCard.findUnique({
        where: { id: cardId },
        include: { binder: true },
      });

      if (!binderCard) {
        res.status(404).json({ error: "Card not found in binder" });
        return;
      }

      if (binderCard.binder.userId !== req.userId) {
        res.status(403).json({ error: "Not authorized to update this card" });
        return;
      }

      const updatedCard = await prisma.binderCard.update({
        where: { id: cardId },
        data: { isAvailable: !binderCard.isAvailable },
        include: { card: true },
      });

      res.json({ binderCard: updatedCard });
    } catch (error) {
      console.error("Toggle availability error:", error);
      res.status(500).json({ error: "Failed to toggle availability" });
    }
  }
);

export default router;

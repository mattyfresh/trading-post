import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Validation schema for profile update
const updateProfileSchema = z.object({
  displayName: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

// GET /api/users/:id - Get user profile
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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
            description: true,
            createdAt: true,
            _count: {
              select: { cards: true },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// PUT /api/users/:id - Update user profile
router.put(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Users can only update their own profile
      if (req.userId !== id) {
        res
          .status(403)
          .json({ error: "Not authorized to update this profile" });
        return;
      }

      const validation = updateProfileSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors,
        });
        return;
      }

      const user = await prisma.user.update({
        where: { id },
        data: validation.data,
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
        },
      });

      res.json({ user });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  }
);

// GET /api/users/:id/binders - Get user's public binders
router.get("/:id/binders", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const binders = await prisma.binder.findMany({
      where: {
        userId: id,
        isPublic: true,
      },
      include: {
        _count: {
          select: { cards: true },
        },
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ binders });
  } catch (error) {
    console.error("Get user binders error:", error);
    res.status(500).json({ error: "Failed to get binders" });
  }
});

export default router;

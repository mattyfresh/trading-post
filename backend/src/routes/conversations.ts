import { Router, Response } from "express";
import { z } from "zod";
import { prisma, io } from "../index.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Validation schemas
const createConversationSchema = z.object({
  sellerId: z.string().uuid("Invalid seller ID"),
  binderCardId: z.string().uuid("Invalid card ID").optional(),
  message: z.string().min(1, "Message is required").max(2000),
});

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message is required").max(2000),
});

// GET /api/conversations - Get user's conversations
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: req.userId }, { sellerId: req.userId }],
      },
      include: {
        buyer: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        binderCard: {
          include: {
            card: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Add unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async conv => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: req.userId },
            isRead: false,
          },
        });
        return { ...conv, unreadCount };
      })
    );

    res.json({ conversations: conversationsWithUnread });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ error: "Failed to get conversations" });
  }
});

// POST /api/conversations - Start new conversation
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const validation = createConversationSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.errors,
      });
      return;
    }

    const { sellerId, binderCardId, message } = validation.data;

    // Can't message yourself
    if (sellerId === req.userId) {
      res
        .status(400)
        .json({ error: "Cannot start a conversation with yourself" });
      return;
    }

    // Check if seller exists
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      res.status(404).json({ error: "Seller not found" });
      return;
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        buyerId: req.userId,
        sellerId,
        binderCardId: binderCardId || null,
      },
    });

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          buyerId: req.userId!,
          sellerId,
          binderCardId: binderCardId || null,
        },
      });
    }

    // Add the first message
    const firstMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: req.userId!,
        content: message,
      },
      include: {
        sender: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Notify both participants in real time
    const payload = { conversationId: conversation.id, message: firstMessage };
    io.to(conversation.buyerId).emit("new_message", payload);
    io.to(conversation.sellerId).emit("new_message", payload);

    // Fetch the full conversation
    const fullConversation = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        buyer: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        binderCard: {
          include: {
            card: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    res.status(201).json({ conversation: fullConversation });
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// GET /api/conversations/:id - Get conversation with messages
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
          buyer: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          seller: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          binderCard: {
            include: {
              card: true,
              binder: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
              sender: {
                select: {
                  id: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      // Check if user is part of this conversation
      if (
        conversation.buyerId !== req.userId &&
        conversation.sellerId !== req.userId
      ) {
        res
          .status(403)
          .json({ error: "Not authorized to view this conversation" });
        return;
      }

      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          conversationId: id,
          senderId: { not: req.userId },
          isRead: false,
        },
        data: { isRead: true },
      });

      res.json({ conversation });
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(500).json({ error: "Failed to get conversation" });
    }
  }
);

// POST /api/conversations/:id/messages - Send message
router.post(
  "/:id/messages",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const validation = sendMessageSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors,
        });
        return;
      }

      // Check if conversation exists and user is part of it
      const conversation = await prisma.conversation.findUnique({
        where: { id },
      });

      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      if (
        conversation.buyerId !== req.userId &&
        conversation.sellerId !== req.userId
      ) {
        res
          .status(403)
          .json({
            error: "Not authorized to send messages in this conversation",
          });
        return;
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          conversationId: id,
          senderId: req.userId!,
          content: validation.data.content,
        },
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      // Notify both participants in real time
      const payload = { conversationId: id, message };
      io.to(conversation.buyerId).emit("new_message", payload);
      io.to(conversation.sellerId).emit("new_message", payload);

      res.status(201).json({ message });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  }
);

// PATCH /api/conversations/:id/read - Mark all messages as read
router.patch(
  "/:id/read",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if conversation exists and user is part of it
      const conversation = await prisma.conversation.findUnique({
        where: { id },
      });

      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      if (
        conversation.buyerId !== req.userId &&
        conversation.sellerId !== req.userId
      ) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }

      // Mark all messages from the other user as read
      await prisma.message.updateMany({
        where: {
          conversationId: id,
          senderId: { not: req.userId },
          isRead: false,
        },
        data: { isRead: true },
      });

      res.json({ message: "Messages marked as read" });
    } catch (error) {
      console.error("Mark read error:", error);
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  }
);

// GET /api/conversations/unread/count - Get total unread message count
router.get(
  "/unread/count",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const count = await prisma.message.count({
        where: {
          conversation: {
            OR: [{ buyerId: req.userId }, { sellerId: req.userId }],
          },
          senderId: { not: req.userId },
          isRead: false,
        },
      });

      res.json({ unreadCount: count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  }
);

export default router;

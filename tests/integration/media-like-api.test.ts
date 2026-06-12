// tests/integration/media-like-api.test.ts

/**
 * Integration tests for media like/unlike API.
 */

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/db/prisma", () => ({
  default: {
    like: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    media: {
      findUnique: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

import { POST } from "@/app/api/media/[mediaId]/like/route";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db/prisma";

const mockSession = {
  user: { id: "user_1", name: "Test", username: "test", role: "CLUB_MEMBER" },
};

const mockMedia = { uploaderId: "user_2" };

describe("POST /api/media/:id/like", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.media.findUnique as jest.Mock).mockResolvedValue(mockMedia);
    (prisma.notification.create as jest.Mock).mockResolvedValue({});
  });

  it("returns 401 when unauthenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = new Request("http://localhost/api/media/m1/like", { method: "POST" });
    const res = await POST(req as any, { params: { mediaId: "m1" } });

    expect(res.status).toBe(401);
  });

  it("creates like when not yet liked", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.like.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.like.create as jest.Mock).mockResolvedValue({});
    (prisma.like.count as jest.Mock).mockResolvedValue(5);

    const req = new Request("http://localhost/api/media/m1/like", { method: "POST" });
    const res = await POST(req as any, { params: { mediaId: "m1" } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.liked).toBe(true);
    expect(json.data.count).toBe(5);
    expect(prisma.like.create).toHaveBeenCalledTimes(1);
  });

  it("removes like when already liked", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.like.findUnique as jest.Mock).mockResolvedValue({ id: "like_1" });
    (prisma.like.delete as jest.Mock).mockResolvedValue({});
    (prisma.like.count as jest.Mock).mockResolvedValue(3);

    const req = new Request("http://localhost/api/media/m1/like", { method: "POST" });
    const res = await POST(req as any, { params: { mediaId: "m1" } });
    const json = await res.json();

    expect(json.data.liked).toBe(false);
    expect(json.data.count).toBe(3);
    expect(prisma.like.delete).toHaveBeenCalledTimes(1);
  });

  it("does not create notification when liking own media", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.like.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.like.create as jest.Mock).mockResolvedValue({});
    (prisma.like.count as jest.Mock).mockResolvedValue(1);
    // Media owned by same user
    (prisma.media.findUnique as jest.Mock).mockResolvedValue({ uploaderId: "user_1" });

    const req = new Request("http://localhost/api/media/m1/like", { method: "POST" });
    await POST(req as any, { params: { mediaId: "m1" } });

    expect(prisma.notification.create).not.toHaveBeenCalled();
  });
});

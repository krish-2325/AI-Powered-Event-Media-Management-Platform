// tests/integration/events-api.test.ts

/**
 * Integration tests for the Events API.
 * These require a running database (set DATABASE_URL in env).
 *
 * Run with: npm test -- --testPathPattern="events-api"
 */

import { createMocks } from "node-mocks-http";
import { GET, POST } from "@/app/api/events/route";

// Mock getServerSession to control auth state
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/db/prisma", () => ({
  default: {
    event: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

import { getServerSession } from "next-auth";
import prisma from "@/lib/db/prisma";

const mockSession = {
  user: {
    id: "user_123",
    email: "test@example.com",
    name: "Test User",
    username: "testuser",
    role: "PHOTOGRAPHER",
  },
};

describe("GET /api/events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.event.count as jest.Mock).mockResolvedValue(0);
  });

  it("returns empty list when no events", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/events");
    const res = await GET(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.events).toEqual([]);
    expect(json.data.pagination.total).toBe(0);
  });

  it("includes MEMBERS_ONLY events for authenticated users", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.event.findMany as jest.Mock).mockResolvedValue([
      { id: "e1", title: "Members Event", accessLevel: "MEMBERS_ONLY", status: "PUBLISHED" },
    ]);
    (prisma.event.count as jest.Mock).mockResolvedValue(1);

    const req = new Request("http://localhost:3000/api/events");
    const res = await GET(req as any);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.events).toHaveLength(1);
  });

  it("filters by category when provided", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/events?category=WORKSHOP");
    await GET(req as any);

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: "WORKSHOP" }),
      })
    );
  });
});

describe("POST /api/events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
  });

  it("returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test", category: "WORKSHOP", accessLevel: "PUBLIC" }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("returns 403 for VIEWER role", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { ...mockSession.user, role: "VIEWER" },
    });

    const req = new Request("http://localhost:3000/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test", category: "WORKSHOP", accessLevel: "PUBLIC" }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid body", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    const req = new Request("http://localhost:3000/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "AB", category: "INVALID" }), // title too short, invalid category
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.errors).toBeDefined();
  });

  it("creates event successfully", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    const mockEvent = {
      id: "evt_1",
      title: "Photography Workshop",
      slug: "photography-workshop",
      category: "WORKSHOP",
      accessLevel: "PUBLIC",
      status: "DRAFT",
      ownerId: "user_123",
    };
    (prisma.event.create as jest.Mock).mockResolvedValue(mockEvent);

    const req = new Request("http://localhost:3000/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Photography Workshop",
        category: "WORKSHOP",
        accessLevel: "PUBLIC",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.title).toBe("Photography Workshop");
  });
});

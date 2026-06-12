// prisma/seed-addendum.ts
// Run this AFTER the main seed to add story demo data
// Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-addendum.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding stories demo data…");

  // Get an existing event and its media
  const event = await prisma.event.findFirst({
    where: { status: "PUBLISHED" },
    include: {
      media: { take: 3, select: { id: true } },
      owner: true,
    },
  });

  if (!event || event.media.length === 0) {
    console.log("No events with media found — skipping stories seed");
    return;
  }

  // Create stories from existing media
  for (const mediaItem of event.media.slice(0, 3)) {
    await prisma.story.create({
      data: {
        authorId: event.ownerId,
        mediaId: mediaItem.id,
        eventId: event.id,
        caption: "Beautiful moment from the event! 📸 — NSUT Photography Society",
        durationSeconds: 5,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log(`✅ Created ${event.media.length} demo stories for event "${event.title}"`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

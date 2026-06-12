// prisma/seed.ts
// Seeds the database with realistic Indian college club demo data

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Real Indian event data ────────────────────────────────────
const INDIAN_EVENTS = [
  {
    title: "Diwali Photography Walk – Chandni Chowk",
    category: "PHOTOSHOOT" as const,
    location: "Chandni Chowk, Old Delhi",
    description:
      "Capture the magic of Diwali lights, diyas, and rangoli across Old Delhi's most iconic lanes. Photographers explore Kinari Bazaar, Paranthe Wali Gali, and the Jama Masjid surroundings.",
    tags: ["diwali", "festival", "lights", "old delhi", "street photography"],
    caption: "Diwali evening glow at Chandni Chowk",
  },
  {
    title: "Annual Techfest 2024 – IIT Bombay",
    category: "COMPETITION" as const,
    location: "IIT Bombay, Powai, Mumbai",
    description:
      "Asia's largest science and technology festival. Robotics competitions, hackathons, guest lectures by ISRO scientists, and the iconic Mood Indigo pre-event performances.",
    tags: ["techfest", "college", "robotics", "competition", "crowd"],
    caption: "Teams presenting at the Robotics arena",
  },
  {
    title: "Holi Celebration – Lodi Garden",
    category: "CULTURAL_FEST" as const,
    location: "Lodi Garden, New Delhi",
    description:
      "Club's annual Holi shoot capturing the colours of Holi at one of Delhi's most beautiful heritage gardens. Participants wear white kurtas and celebrate with organic colours.",
    tags: ["holi", "colours", "festival", "garden", "celebration"],
    caption: "Burst of colours during Holi at Lodi Garden",
  },
  {
    title: "Ladakh Expedition – Pangong Lake Shoot",
    category: "TRIP" as const,
    location: "Pangong Tso, Ladakh",
    description:
      "A 10-day photography expedition through Leh, Nubra Valley, and the iconic Pangong Lake. Documenting the monasteries, mountains, and the people of Ladakh.",
    tags: ["ladakh", "mountains", "pangong", "monastery", "landscape"],
    caption: "Blue waters of Pangong Lake at golden hour",
  },
  {
    title: "Street Food Photography – Varanasi Ghats",
    category: "WORKSHOP" as const,
    location: "Dashashwamedh Ghat, Varanasi",
    description:
      "A guided workshop on food and street photography at the ghats of Varanasi. Focus on the chai wallahs, boat vendors, and the evening Ganga Aarti.",
    tags: ["varanasi", "ghats", "street food", "aarti", "workshop"],
    caption: "Evening Ganga Aarti ceremony at Dashashwamedh Ghat",
  },
];

const INDIAN_CLUBS = [
  {
    name: "NSUT Photography Society",
    slug: "nsut-photography-society",
    description:
      "The official photography club of Netaji Subhas University of Technology, New Delhi. We document college life, organise expeditions, and conduct workshops for all skill levels.",
  },
];

const DEMO_ACCOUNTS = [
  {
    email: "admin@pixvault.app",
    username: "admin_rahul",
    name: "Rahul Sharma",
    role: "SUPER_ADMIN" as const,
    password: "Admin@1234",
    bio: "Platform administrator. Photography enthusiast from Delhi.",
  },
  {
    email: "photographer@pixvault.app",
    username: "arjun_clicks",
    name: "Arjun Mehta",
    role: "PHOTOGRAPHER" as const,
    password: "Photo@1234",
    bio: "Senior photographer at NSUT Photography Society. Specialises in street and festival photography across India.",
  },
  {
    email: "member@pixvault.app",
    username: "priya_nsut",
    name: "Priya Patel",
    role: "CLUB_MEMBER" as const,
    password: "Member@1234",
    bio: "Third year CSE student at NSUT. Passionate about travel photography.",
  },
];

async function main() {
  console.log("🌱 Seeding PixVault with Indian college club data...\n");

  // ── Create demo accounts ──────────────────────────────────────
  const createdUsers: Record<string, any> = {};

  for (const account of DEMO_ACCOUNTS) {
    const hashedPassword = await bcrypt.hash(account.password, 12);

    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        email: account.email,
        username: account.username,
        name: account.name,
        role: account.role,
        bio: account.bio,
      },
    });

    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "credentials",
          providerAccountId: user.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: user.id,
        access_token: hashedPassword,
      },
    });

    createdUsers[account.role] = user;
    console.log(`✅ Created user: ${account.name} (${account.role})`);
  }

  // ── Create club ───────────────────────────────────────────────
  const club = await prisma.club.upsert({
    where: { slug: INDIAN_CLUBS[0].slug },
    update: {},
    create: INDIAN_CLUBS[0],
  });
  console.log(`✅ Created club: ${club.name}`);

  // Add all users as club members
  for (const user of Object.values(createdUsers)) {
    await prisma.clubMember.upsert({
      where: { userId_clubId: { userId: user.id, clubId: club.id } },
      update: {},
      create: { userId: user.id, clubId: club.id, role: user.role },
    });
  }

  // ── Create events with realistic Indian content ───────────────
  const photographer = createdUsers["PHOTOGRAPHER"];

  for (const eventData of INDIAN_EVENTS) {
    const slug = eventData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);

    const existing = await prisma.event.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60));

    const event = await prisma.event.create({
      data: {
        title: eventData.title,
        slug: finalSlug,
        description: eventData.description,
        category: eventData.category,
        status: "PUBLISHED",
        accessLevel: "PUBLIC",
        location: eventData.location,
        startDate,
        ownerId: photographer.id,
        clubId: club.id,
      },
    });

    // Create a default album per event
    const album = await prisma.album.create({
      data: {
        name: "Best Shots",
        description: "Curated highlights from the event",
        accessLevel: "PUBLIC",
        eventId: event.id,
      },
    });

    // Seed 8 placeholder media items per event
    // (In production these would be real S3 uploads)
    for (let j = 0; j < 8; j++) {
      const seed = `${event.id}-${j}`;
      await prisma.media.create({
        data: {
          type: "IMAGE",
          s3Key: `media/demo/${event.id}/${j}.jpg`,
          s3Bucket: "pixvault-demo",
          // Using picsum.photos for demo — replace with real S3 URLs after upload
          originalUrl: `https://picsum.photos/seed/${seed}/1200/800`,
          thumbnailUrl: `https://picsum.photos/seed/${seed}/600/400`,
          previewUrl: `https://picsum.photos/seed/${seed}/400/300`,
          fileSize: 1_200_000 + j * 200_000,
          mimeType: "image/jpeg",
          width: 1200,
          height: 800,
          aiTags: eventData.tags,
          aiCaption: eventData.caption,
          uploaderId: photographer.id,
          eventId: event.id,
          albumId: album.id,
          accessLevel: "PUBLIC",
        },
      });
    }

    console.log(`✅ Created event: "${event.title}" (${event.category}) with 8 photos`);
  }

  console.log("\n🎉 Seeding complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Demo accounts:");
  console.log("  Admin        → admin@pixvault.app        / Admin@1234");
  console.log("  Photographer → photographer@pixvault.app  / Photo@1234");
  console.log("  Member       → member@pixvault.app        / Member@1234");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

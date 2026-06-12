// APPEND THIS TO prisma/schema.prisma
// Story & Highlight models

// ─────────────────────────────────────────────
// STORIES (24-hour expiring, Instagram-style)
// ─────────────────────────────────────────────

// model Story {
//   id              String    @id @default(cuid())
//   authorId        String
//   mediaId         String
//   eventId         String
//   caption         String?
//   durationSeconds Int       @default(5)
//   expiresAt       DateTime
//   createdAt       DateTime  @default(now())
//
//   author  User      @relation("StoryAuthor", fields: [authorId], references: [id], onDelete: Cascade)
//   media   Media     @relation(fields: [mediaId], references: [id], onDelete: Cascade)
//   event   Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
//   views   StoryView[]
//
//   @@index([eventId])
//   @@index([authorId])
//   @@index([expiresAt])
//   @@map("stories")
// }
//
// model StoryView {
//   id       String   @id @default(cuid())
//   userId   String
//   storyId  String
//   viewedAt DateTime @default(now())
//
//   user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
//   story Story @relation(fields: [storyId], references: [id], onDelete: Cascade)
//
//   @@unique([userId, storyId])
//   @@map("story_views")
// }
//
// ── Add these relations to existing models: ──
// User:  stories  Story[]  @relation("StoryAuthor")
// User:  storyViews StoryView[]
// Media: stories  Story[]
// Event: stories  Story[]

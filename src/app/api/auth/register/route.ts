// src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import { registerSchema } from "@/lib/validations";
import { createApiError, createApiSuccess } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, username, email, password } = parsed.data;

    // Check email uniqueness
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    if (existingEmail) {
      return NextResponse.json(
        createApiError("An account with this email already exists"),
        { status: 409 }
      );
    }

    // Check username uniqueness
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });
    if (existingUsername) {
      return NextResponse.json(
        createApiError("This username is already taken"),
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user + credentials account in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          username: username.toLowerCase(),
          email: email.toLowerCase(),
          role: "VIEWER",
        },
      });

      // Store hashed password in the account table (provider: "credentials")
      await tx.account.create({
        data: {
          userId: newUser.id,
          type: "credentials",
          provider: "credentials",
          providerAccountId: newUser.id,
          access_token: hashedPassword, // repurpose field for password hash
        },
      });

      return newUser;
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "REGISTER",
        entityType: "user",
        entityId: user.id,
      },
    });

    return NextResponse.json(
      createApiSuccess({ id: user.id, email: user.email, username: user.username }),
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json(createApiError("Registration failed"), { status: 500 });
  }
}

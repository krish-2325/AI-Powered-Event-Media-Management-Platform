// src/lib/auth/auth-options.ts

import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import type { UserRole } from "@/lib/types/user";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      name: string;
      avatarUrl?: string | null;
      role: UserRole;
    };
  }
  interface User {
    username: string;
    role: UserRole;
    avatarUrl?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: UserRole;
    avatarUrl?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
    error: "/auth/error",
    newUser: "/auth/register",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) {
          throw new Error("No account found with this email");
        }

        if (user.isBanned) {
          throw new Error("Your account has been suspended");
        }

        // Get password from accounts table (credentials provider)
        const account = await prisma.account.findFirst({
          where: { userId: user.id, provider: "credentials" },
        });

        if (!account?.access_token) {
          throw new Error("Please sign in with your social account");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          account.access_token
        );

        if (!isPasswordValid) {
          throw new Error("Incorrect password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          role: user.role as UserRole,
          avatarUrl: user.avatarUrl,
          image: user.avatarUrl,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          username: profile.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, ""),
          role: "VIEWER" as UserRole,
          avatarUrl: profile.picture,
          image: profile.picture,
        };
      },
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name ?? profile.login,
          email: profile.email ?? "",
          username: profile.login,
          role: "VIEWER" as UserRole,
          avatarUrl: profile.avatar_url,
          image: profile.avatar_url,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.avatarUrl = user.avatarUrl;
      }

      // Handle session update
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.avatarUrl = token.avatarUrl;
      }
      return session;
    },

    async signIn({ user, account }) {
      // Block banned users
      if (user.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isBanned: true, isActive: true },
        });
        if (dbUser?.isBanned || !dbUser?.isActive) {
          return false;
        }
      }
      return true;
    },
  },

  events: {
    async signIn({ user }) {
      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "SIGN_IN",
          entityType: "user",
          entityId: user.id,
        },
      });
    },
  },

  debug: process.env.NODE_ENV === "development",
};

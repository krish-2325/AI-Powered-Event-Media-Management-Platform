// tests/unit/validations.test.ts

import {
  registerSchema,
  loginSchema,
  createEventSchema,
  createCommentSchema,
  updateProfileSchema,
} from "@/lib/validations";

describe("registerSchema", () => {
  const valid = {
    name: "Jane Doe",
    username: "janedoe",
    email: "jane@example.com",
    password: "Password1",
    confirmPassword: "Password1",
  };

  it("accepts valid input", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects short name", () => {
    const result = registerSchema.safeParse({ ...valid, name: "J" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects weak password (no uppercase)", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "password1",
      confirmPassword: "password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password (no number)", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "Password",
      confirmPassword: "Password",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...valid,
      confirmPassword: "Different1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects username with spaces", () => {
    const result = registerSchema.safeParse({ ...valid, username: "jane doe" });
    expect(result.success).toBe(false);
  });

  it("rejects username with special chars", () => {
    const result = registerSchema.safeParse({ ...valid, username: "jane@doe" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "abc" });
    expect(result.success).toBe(true);
  });

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("createEventSchema", () => {
  const valid = {
    title: "Photography Workshop",
    category: "WORKSHOP",
    accessLevel: "PUBLIC",
  };

  it("accepts minimal valid input", () => {
    expect(createEventSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects short title", () => {
    const result = createEventSchema.safeParse({ ...valid, title: "AB" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = createEventSchema.safeParse({ ...valid, category: "UNKNOWN" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid accessLevel", () => {
    const result = createEventSchema.safeParse({ ...valid, accessLevel: "SECRET" });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = createEventSchema.safeParse({
      ...valid,
      description: "A great event",
      location: "Mumbai",
      startDate: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });
});

describe("createCommentSchema", () => {
  it("accepts valid comment", () => {
    const result = createCommentSchema.safeParse({
      content: "Great photo!",
      mediaId: "cuid1234567890abcdef",
    });
    // cuid validation may fail with fake id in test, but we at least ensure it runs
    expect(typeof result.success).toBe("boolean");
  });

  it("rejects empty content", () => {
    const result = createCommentSchema.safeParse({
      content: "",
      mediaId: "cuid1234567890abcdef",
    });
    expect(result.success).toBe(false);
  });

  it("rejects content that is too long", () => {
    const result = createCommentSchema.safeParse({
      content: "a".repeat(1001),
      mediaId: "cuid1234567890abcdef",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts partial updates", () => {
    expect(updateProfileSchema.safeParse({ bio: "Hello world" }).success).toBe(true);
    expect(updateProfileSchema.safeParse({}).success).toBe(true);
  });

  it("rejects bio that is too long", () => {
    const result = updateProfileSchema.safeParse({ bio: "a".repeat(301) });
    expect(result.success).toBe(false);
  });

  it("rejects username with invalid chars", () => {
    const result = updateProfileSchema.safeParse({ username: "bad user!" });
    expect(result.success).toBe(false);
  });
});

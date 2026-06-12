// tests/unit/utils.test.ts

import {
  cn,
  slugify,
  truncate,
  formatBytes,
  formatNumber,
  isImageFile,
  isVideoFile,
  isAllowedMediaType,
  chunk,
  uniqueBy,
  omit,
  pick,
} from "@/lib/utils";

describe("cn (class merging)", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("deduplicates tailwind classes", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "skipped", "included")).toBe("base included");
  });
});

describe("slugify", () => {
  it("converts to lowercase with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Event! 2024 #photo")).toBe("event-2024-photo");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("a  b  c")).toBe("a-b-c");
  });
});

describe("truncate", () => {
  it("returns original if short enough", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("appends ellipsis if too long", () => {
    expect(truncate("hello world", 5)).toBe("hello…");
  });
});

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });
});

describe("formatNumber", () => {
  it("formats small numbers as-is", () => {
    expect(formatNumber(999)).toBe("999");
  });

  it("formats thousands with K", () => {
    expect(formatNumber(1500)).toBe("1.5K");
  });

  it("formats millions with M", () => {
    expect(formatNumber(2_000_000)).toBe("2.0M");
  });
});

describe("media type helpers", () => {
  it("detects image files", () => {
    expect(isImageFile("image/jpeg")).toBe(true);
    expect(isImageFile("video/mp4")).toBe(false);
  });

  it("detects video files", () => {
    expect(isVideoFile("video/mp4")).toBe(true);
    expect(isVideoFile("image/png")).toBe(false);
  });

  it("validates allowed media types", () => {
    expect(isAllowedMediaType("image/jpeg")).toBe(true);
    expect(isAllowedMediaType("video/mp4")).toBe(true);
    expect(isAllowedMediaType("application/pdf")).toBe(false);
    expect(isAllowedMediaType("text/plain")).toBe(false);
  });
});

describe("chunk", () => {
  it("splits array into chunks", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("handles empty array", () => {
    expect(chunk([], 3)).toEqual([]);
  });
});

describe("uniqueBy", () => {
  it("deduplicates by key", () => {
    const arr = [{ id: 1, name: "a" }, { id: 2, name: "b" }, { id: 1, name: "c" }];
    expect(uniqueBy(arr, "id")).toHaveLength(2);
  });
});

describe("omit", () => {
  it("omits specified keys", () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(omit(obj, "b", "c")).toEqual({ a: 1 });
  });
});

describe("pick", () => {
  it("picks specified keys", () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(pick(obj, "a", "c")).toEqual({ a: 1, c: 3 });
  });
});

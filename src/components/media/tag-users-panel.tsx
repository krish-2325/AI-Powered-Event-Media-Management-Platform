// src/components/media/tag-users-panel.tsx
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Tag, X, Search, Check, Loader2 } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { toast } from "@/lib/hooks/use-toast";

interface TaggedUser {
  id: string;
  taggedUserId: string;
  x?: number | null;
  y?: number | null;
  taggedUser: { id: string; name: string; username: string; avatarUrl?: string | null };
}

interface TagUsersPanelProps {
  mediaId: string;
  imageUrl: string;
  width?: number;
  height?: number;
  existingTags: TaggedUser[];
  canTag: boolean;
  onTagsChange?: (tags: TaggedUser[]) => void;
}

interface UserResult {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
}

export function TagUsersPanel({ mediaId, imageUrl, width, height, existingTags, canTag, onTagsChange }: TagUsersPanelProps) {
  const [tags, setTags] = useState<TaggedUser[]>(existingTags);
  const [isTagMode, setIsTagMode] = useState(false);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(search, 350);

  // Search users
  const handleSearch = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      setSearchResults(data.data ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Trigger search on debounce
  useState(() => { handleSearch(debouncedSearch); });

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTagMode || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPendingPos({ x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 });
    setSearch("");
    setSearchResults([]);
  };

  const handleTagUser = async (user: UserResult) => {
    if (!pendingPos) return;
    setIsTagging(true);
    try {
      const res = await fetch(`/api/media/${mediaId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taggedUserId: user.id, x: pendingPos.x, y: pendingPos.y }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      const newTag: TaggedUser = {
        id: data.data.id,
        taggedUserId: user.id,
        x: pendingPos.x,
        y: pendingPos.y,
        taggedUser: user,
      };
      const updated = [...tags, newTag];
      setTags(updated);
      onTagsChange?.(updated);
      toast({ title: `Tagged ${user.name}`, variant: "success" });
    } catch (err) {
      toast({ title: "Failed to tag user", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setIsTagging(false);
      setPendingPos(null);
      setSearch("");
      setSearchResults([]);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    setRemovingId(tagId);
    try {
      const res = await fetch(`/api/media/${mediaId}/tags/${tagId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      const updated = tags.filter((t) => t.id !== tagId);
      setTags(updated);
      onTagsChange?.(updated);
    } catch {
      toast({ title: "Failed to remove tag", variant: "error" });
    } finally {
      setRemovingId(null);
    }
  };

  const aspectRatio = width && height ? height / width : 0.75;

  return (
    <div className="space-y-3">
      {/* Image with tag dots overlay */}
      <div
        ref={imgRef}
        onClick={handleImageClick}
        className={cn("relative w-full overflow-hidden rounded-xl bg-muted", isTagMode && "cursor-crosshair")}
        style={{ paddingBottom: `${aspectRatio * 100}%` }}
      >
        <Image src={imageUrl} alt="Photo" fill className="object-cover" sizes="600px" />

        {/* Existing tag dots */}
        {tags.map((tag) => tag.x != null && tag.y != null && (
          <div key={tag.id}
            className="absolute group"
            style={{ left: `${tag.x * 100}%`, top: `${tag.y * 100}%`, transform: "translate(-50%,-50%)" }}>
            <div className="w-6 h-6 rounded-full border-2 border-white bg-primary/80 shadow-lg cursor-pointer" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap bg-black/80 text-white text-xs rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {tag.taggedUser.name}
            </div>
          </div>
        ))}

        {/* Pending position indicator */}
        {pendingPos && (
          <div className="absolute animate-pulse"
            style={{ left: `${pendingPos.x * 100}%`, top: `${pendingPos.y * 100}%`, transform: "translate(-50%,-50%)" }}>
            <div className="w-7 h-7 rounded-full border-2 border-white bg-primary shadow-lg" />
          </div>
        )}
      </div>

      {/* Controls */}
      {canTag && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsTagMode(!isTagMode); setPendingPos(null); setSearch(""); setSearchResults([]); }}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              isTagMode ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:bg-secondary"
            )}>
            <Tag className="w-3.5 h-3.5" />
            {isTagMode ? "Click photo to tag" : "Tag people"}
          </button>
          {isTagMode && (
            <button onClick={() => { setIsTagMode(false); setPendingPos(null); }} className="text-xs text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Search panel after clicking photo */}
      {pendingPos && (
        <div className="bg-card border border-border rounded-xl p-3 space-y-2">
          <p className="text-xs font-medium text-foreground">Search for a user to tag:</p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a name or username…"
              autoFocus
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {isSearching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </div>
          {searchResults.length > 0 && (
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {searchResults.map((user) => (
                <button key={user.id} onClick={() => handleTagUser(user)} disabled={isTagging}
                  className="flex items-center gap-3 w-full px-3 py-2 hover:bg-secondary transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-semibold text-primary">
                    {user.avatarUrl ? <Image src={user.avatarUrl} alt={user.name} width={32} height={32} className="object-cover" /> : user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                  {isTagging && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setPendingPos(null)} className="text-xs text-muted-foreground hover:text-foreground">
            Cancel tag
          </button>
        </div>
      )}

      {/* Tagged users list */}
      {tags.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tagged people</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full">
                <span className="text-xs font-medium text-primary">{tag.taggedUser.name}</span>
                {canTag && (
                  <button onClick={() => handleRemoveTag(tag.id)} disabled={removingId === tag.id}
                    className="text-primary/60 hover:text-primary transition-colors">
                    {removingId === tag.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

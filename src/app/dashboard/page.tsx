"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Trash2,
  ExternalLink,
  Plus,
  LogOut,
  Bookmark as BookmarkIcon,
  Globe,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  created_at?: string;
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/");
        return;
      }
      setUser(user);

      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setBookmarks(data);
      setLoading(false);
    };

    loadData();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    // Create realtime subscription after user is loaded
    const channel = supabase
      .channel("realtime-bookmarks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newEntry = payload.new as Bookmark;
            setBookmarks((prev) => {
              // Check if bookmark already exists (to avoid duplicates from optimistic update)
              if (prev.find((b) => b.id === newEntry.id)) return prev;
              return [newEntry, ...prev];
            });
          } else if (payload.eventType === "DELETE") {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return toast.error("Please fill in all fields");

    // Format the URL to ensure consistency for the duplicate check
    const formattedUrl = url.trim().startsWith("http")
      ? url.trim()
      : `https://${url.trim()}`;

    // DUPLICATE CHECK: See if the URL already exists in the current list
    const isDuplicate = bookmarks.some(
      (b) => b.url.toLowerCase() === formattedUrl.toLowerCase(),
    );

    if (isDuplicate) {
      setTitle("");
      setUrl("");
      return toast.error("You've already saved this link!");
    }

    // Optimistic UI Update
    const tempId = crypto.randomUUID();
    const optimisticBookmark: Bookmark = {
      id: tempId,
      title: title.trim(),
      url: formattedUrl,
      created_at: new Date().toISOString(),
    };

    setBookmarks((prev) => [optimisticBookmark, ...prev]);
    const savedTitle = title;
    setTitle("");
    setUrl("");

    // Background Database Sync
    const { data, error } = await supabase
      .from("bookmarks")
      .insert([
        {
          title: savedTitle,
          url: formattedUrl,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      toast.error("Failed to sync with database");
      setBookmarks((prev) => prev.filter((b) => b.id !== tempId));
    } else {
      setBookmarks((prev) => prev.map((b) => (b.id === tempId ? data : b)));
      toast.success("Saved!");
    }
  };

  const deleteBookmark = async (id: string) => {
    // Optimistic Delete
    const originalBookmarks = [...bookmarks];
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Could not delete");
      setBookmarks(originalBookmarks); // Rollback
    } else {
      toast.success("Removed");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-white">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <BookmarkIcon size={20} />
            </div>
            SmartMark
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-[350px_1fr] gap-10">
        <aside>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl sticky top-24">
            <h2 className="text-lg font-semibold text-white mb-4">Add Link</h2>
            <form onSubmit={addBookmark} className="space-y-4">
              <input
                placeholder="Title"
                className="w-full p-3 rounded-xl bg-slate-800 border border-white/5 focus:border-indigo-500 outline-none transition"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                placeholder="URL (e.g. google.com)"
                className="w-full p-3 rounded-xl bg-slate-800 border border-white/5 focus:border-indigo-500 outline-none transition"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium p-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Plus size={18} /> Save Bookmark
              </button>
            </form>
          </div>
        </aside>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Your Bookmarks</h1>
            <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs">
              {bookmarks.length} Total
            </span>
          </div>

          <div className="grid gap-4">
            {bookmarks.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/40 border border-dashed border-white/10 rounded-2xl">
                <Globe className="mx-auto text-slate-700 mb-4" size={40} />
                <p className="text-slate-500">Your collection is empty.</p>
              </div>
            ) : (
              bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="group bg-slate-900 hover:bg-slate-800/80 border border-white/5 p-4 rounded-2xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="h-10 w-10 shrink-0 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                      <Globe size={20} />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-semibold text-white truncate">
                        {b.title}
                      </h3>
                      <p className="text-sm text-slate-500 truncate">{b.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
                    >
                      <ExternalLink size={18} />
                    </a>
                    <button
                      onClick={() => deleteBookmark(b.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

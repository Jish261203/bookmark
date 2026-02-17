"use client";

import { supabase } from "@/lib/supabase";
import { Bookmark as BookmarkIcon } from "lucide-react";

export default function LoginPage() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-600/20">
            <BookmarkIcon className="text-white" size={32} />
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">SmartMark</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            The minimal bookmark manager for modern developers. Store, sync, and
            access links anywhere.
          </p>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-950 px-6 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all active:scale-[0.98] shadow-lg"
          >
            <img
              src="https://www.google.com/favicon.ico"
              className="w-5 h-5"
              alt="Google"
            />
            Continue with Google
          </button>

          <div className="mt-8 pt-8 border-t border-white/5 flex justify-center gap-6">
            <div className="text-center">
              <p className="text-white font-semibold">Real-time</p>
              <p className="text-xs text-slate-500">Sync</p>
            </div>
            <div className="text-center border-x border-white/5 px-6">
              <p className="text-white font-semibold">Private</p>
              <p className="text-xs text-slate-500">Encrypted</p>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">Simple</p>
              <p className="text-xs text-slate-500">Fast UI</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
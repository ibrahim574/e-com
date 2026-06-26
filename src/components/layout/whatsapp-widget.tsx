"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

export function WhatsAppWidget({
  number,
  greeting,
}: {
  number: string;
  greeting?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(greeting ?? "");

  function openWhatsApp() {
    const text = message.trim() || greeting || "";
    const url = `https://wa.me/${number}${
      text ? `?text=${encodeURIComponent(text)}` : ""
    }`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <div className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div className="w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between bg-[#25D366] px-4 py-3 text-white">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <MessageCircle className="h-4 w-4" /> Chat with us
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded p-0.5 hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Send us a message on WhatsApp and we&apos;ll reply shortly.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Type your message…"
              className="mt-3 w-full resize-none rounded-lg border border-slate-300 p-2 text-sm focus:border-[#25D366] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={openWhatsApp}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1ebe5d]"
            >
              <Send className="h-4 w-4" /> Open WhatsApp
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat on WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:bg-[#1ebe5d] active:scale-95"
      >
        <MessageCircle className="h-7 w-7" />
      </button>
    </div>
  );
}

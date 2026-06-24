import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, BarChart3 } from 'lucide-react';
import { SaraAvatar } from './SaraAvatar';

const NAVY = '#003087';

export interface SaraChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

function formatChatTime(date: Date) {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function renderChatContent(text: string) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(1, -1)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function SaraTypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2"
    >
      <SaraAvatar size="sm" />
      <div className="rounded-2xl rounded-bl-sm border border-blue-100/80 bg-white px-3.5 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: NAVY }}
                animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35], scale: [0.9, 1.1, 0.9] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
          <span className="text-[11px] font-medium text-slate-500">Sara mengetik…</span>
        </div>
      </div>
    </motion.div>
  );
}

function ChatBubble({ message }: { message: SaraChatMessage }) {
  const isSara = message.role === 'assistant';

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex w-full ${isSara ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`flex max-w-[min(90%,22rem)] gap-2 sm:max-w-[75%] ${
          isSara ? 'flex-row items-end' : 'flex-row-reverse items-end'
        }`}
      >
        {isSara && <SaraAvatar size="sm" className="mb-0.5 shrink-0" />}

        <div className={`flex min-w-0 flex-col ${isSara ? 'items-start' : 'items-end'}`}>
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed shadow-sm sm:text-sm ${
              isSara
                ? 'rounded-bl-sm border border-slate-100 bg-white text-slate-800'
                : 'rounded-br-sm text-white'
            }`}
            style={isSara ? undefined : { backgroundColor: NAVY }}
          >
            <p className="whitespace-pre-wrap break-words">{renderChatContent(message.content)}</p>
          </div>
          <span className="mt-1 px-0.5 text-[10px] text-slate-400">{formatChatTime(message.timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export type SaraQuickReply = {
  field: string;
  options: string[];
};

export interface SaraChatPanelProps {
  messages: SaraChatMessage[];
  loadingChat: boolean;
  errorText: string | null;
  inputText: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  quickReply?: SaraQuickReply | null;
  onQuickReply?: (value: string) => void;
  positionHint?: string;
  onClose?: () => void;
  onToggleSync?: () => void;
  syncOpen?: boolean;
  syncPct?: number;
  syncDrawer?: React.ReactNode;
  className?: string;
}

export function SaraChatPanel({
  messages,
  loadingChat,
  errorText,
  inputText,
  onInputChange,
  onSubmit,
  quickReply,
  onQuickReply,
  positionHint,
  onClose,
  onToggleSync,
  syncOpen,
  syncPct = 0,
  syncDrawer,
  className = '',
}: SaraChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevLenRef = useRef(messages.length);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    const isNewMessage = messages.length > prevLenRef.current;
    prevLenRef.current = messages.length;
    requestAnimationFrame(() => {
      scrollToBottom(isNewMessage ? 'smooth' : 'auto');
    });
  }, [messages, loadingChat, scrollToBottom]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loadingChat && inputText.trim()) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 md:rounded-2xl md:border md:border-slate-200/80 md:shadow-xl md:shadow-slate-200/40 ${className}`}
    >
      {/* Fixed header */}
      <header
        className="z-10 flex shrink-0 items-center gap-2.5 border-b border-slate-200/80 bg-white px-3 py-2.5 sm:px-4 sm:py-3"
        style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup chat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="relative shrink-0">
          <SaraAvatar size="md" className="ring-2 ring-slate-100" />
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400"
            aria-hidden
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-bold text-slate-900">Sara</h4>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Online
            </span>
          </div>
          <p className="truncate text-[11px] text-slate-500">Asisten Rekrutmen · PT Perdana Adi Yuda</p>
          {positionHint && (
            <p className="truncate text-[10px] font-medium text-[#003087]/80">Lamar: {positionHint}</p>
          )}
        </div>

        {onToggleSync && (
          <button
            type="button"
            onClick={onToggleSync}
            aria-expanded={syncOpen}
            aria-label={syncOpen ? 'Sembunyikan progress data' : 'Lihat progress data'}
            className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${
              syncOpen ? 'bg-[#003087] text-white' : 'text-[#003087] hover:bg-blue-50'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            {syncPct > 0 && !syncOpen && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white">
                {syncPct}
              </span>
            )}
          </button>
        )}
      </header>

      <AnimatePresence>
        {syncDrawer && syncOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="shrink-0 overflow-hidden border-b border-slate-200/80 bg-white px-2 md:hidden"
          >
            {syncDrawer}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable messages */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain scroll-smooth px-3 py-4 sm:px-4 sm:py-5"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
          {loadingChat && <SaraTypingIndicator key="typing" />}
        </AnimatePresence>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {errorText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="shrink-0 border-t border-red-100 bg-red-50 px-4 py-2 text-center text-xs font-medium text-red-700"
            role="alert"
          >
            {errorText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick reply chips */}
      {quickReply && onQuickReply && quickReply.options.length > 0 && !loadingChat && (
        <div
          className="shrink-0 border-t border-slate-100 bg-slate-50/90 px-3 py-2.5 sm:px-4"
          role="group"
          aria-label="Pilihan jawaban cepat"
        >
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Pilih jawaban
          </p>
          <div className="flex flex-wrap gap-2">
            {quickReply.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onQuickReply(option)}
                className="rounded-full border border-[#003087]/20 bg-white px-3.5 py-2 text-xs font-semibold text-[#003087] shadow-sm transition hover:border-[#003087]/40 hover:bg-blue-50 active:scale-[0.98]"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fixed footer input */}
      <footer
        className="shrink-0 border-t border-slate-200/80 bg-white px-3 py-2.5 sm:px-4 sm:py-3"
        style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
      >
        <form onSubmit={onSubmit}>
          <div className="flex items-end gap-2">
            <label htmlFor="chat_input_field" className="sr-only">
              Balas Sara
            </label>
            <textarea
              ref={inputRef}
              id="chat_input_field"
              rows={1}
              value={inputText}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loadingChat}
              placeholder={loadingChat ? 'Tunggu Sara…' : 'Ketik pesan…'}
              className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base leading-snug text-slate-800 placeholder:text-slate-400 transition focus:border-[#003087]/35 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003087]/10 disabled:opacity-60 sm:min-h-[42px] sm:text-sm"
            />
            <button
              type="submit"
              disabled={loadingChat || !inputText.trim()}
              id="chat_submit_btn"
              aria-label="Kirim pesan"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-md transition hover:opacity-95 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
              style={{ backgroundColor: NAVY }}
            >
              <Send className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ShieldCheck } from 'lucide-react';
import { SaraAvatar } from './SaraAvatar';

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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex items-end gap-2.5"
    >
      <SaraAvatar size="sm" />
      <div className="rounded-2xl rounded-bl-md border border-blue-100/90 bg-blue-50/90 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5" aria-label="Sara sedang mengetik">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full bg-[#003087]/55"
              animate={{ y: [0, -5, 0], opacity: [0.45, 1, 0.45] }}
              transition={{
                duration: 0.85,
                repeat: Infinity,
                delay: i * 0.18,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ChatBubble({ message }: { message: SaraChatMessage }) {
  const isSara = message.role === 'assistant';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`flex w-full ${isSara ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`flex max-w-[min(88%,20rem)] gap-2.5 sm:max-w-[78%] sm:gap-3 ${
          isSara ? 'flex-row items-end' : 'flex-row-reverse items-end'
        }`}
      >
        {isSara && <SaraAvatar size="sm" className="mb-0.5" />}

        <div className={`flex min-w-0 flex-col ${isSara ? 'items-start' : 'items-end'}`}>
          {isSara && (
            <span className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-[#003087]/70">
              Sara
            </span>
          )}
          <div
            className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm sm:text-sm ${
              isSara
                ? 'rounded-bl-md border border-blue-100/90 bg-gradient-to-br from-blue-50 to-slate-50 text-slate-800'
                : 'rounded-br-md bg-[#003087] text-white'
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{renderChatContent(message.content)}</p>
          </div>
          <span className="mt-1 px-1 text-[10px] text-slate-400">{formatChatTime(message.timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export interface SaraChatPanelProps {
  messages: SaraChatMessage[];
  loadingChat: boolean;
  errorText: string | null;
  inputText: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  positionHint?: string;
}

export function SaraChatPanel({
  messages,
  loadingChat,
  errorText,
  inputText,
  onInputChange,
  onSubmit,
  positionHint,
}: SaraChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingChat]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loadingChat && inputText.trim()) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <div className="flex min-h-[min(72dvh,680px)] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg shadow-slate-200/50">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#003087]/10 bg-gradient-to-r from-[#003087] via-[#003087] to-blue-800 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative">
            <SaraAvatar size="md" className="ring-2 ring-white/30" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#003087] bg-emerald-400" aria-hidden />
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-extrabold tracking-wide text-white">Sara</h4>
            <p className="truncate text-[11px] font-medium text-blue-100/90">
              Asisten Rekrutmen · PT Perdana Adi Yuda
            </p>
            {positionHint && (
              <p className="mt-0.5 truncate text-[10px] text-cyan-200/90">Lamar: {positionHint}</p>
            )}
          </div>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-blue-50 sm:inline-flex">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Sesi Aman
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50/80 to-white px-3 py-4 sm:px-5 sm:py-5">
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
          {loadingChat && <SaraTypingIndicator />}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Error */}
      <AnimatePresence>
        {errorText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="shrink-0 border-y border-red-100 bg-red-50 px-4 py-2.5 text-center text-xs font-medium text-red-700"
            role="alert"
          >
            {errorText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form
        onSubmit={onSubmit}
        className="shrink-0 border-t border-slate-100 bg-white p-3 sm:p-4"
      >
        <div className="flex items-end gap-2 sm:gap-3">
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
            placeholder={loadingChat ? 'Sara sedang mengetik…' : 'Ketik pesanmu untuk Sara…'}
            className="min-h-[52px] max-h-32 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base leading-snug text-slate-800 placeholder:text-slate-400 transition focus:border-[#003087]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003087]/15 disabled:opacity-60 sm:min-h-[48px] sm:text-sm"
          />
          <button
            type="submit"
            disabled={loadingChat || !inputText.trim()}
            id="chat_submit_btn"
            aria-label="Kirim pesan"
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#003087] text-white shadow-md transition hover:bg-blue-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:w-12"
          >
            <Send className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p className="mt-2 hidden text-center text-[10px] text-slate-400 sm:block">
          Enter untuk kirim · Shift+Enter baris baru
        </p>
      </form>
    </div>
  );
}
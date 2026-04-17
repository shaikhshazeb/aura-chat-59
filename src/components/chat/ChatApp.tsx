import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelLeft, Sparkles, Trash2, Lightbulb, Code2, Compass, BookOpen } from "lucide-react";
import { ChatMessage, TypingIndicator, type ChatMessageData } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Sidebar, type Conversation } from "./Sidebar";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

type StoredConvo = Conversation & { messages: ChatMessageData[] };

const STORAGE_KEY = "nova.chats.v1";

const SUGGESTIONS = [
  { icon: Lightbulb, label: "Explain quantum entanglement", text: "Explain quantum entanglement like I'm 15." },
  { icon: Code2, label: "Debug a TypeScript error", text: "Help me debug a tricky TypeScript generics error." },
  { icon: Compass, label: "Plan a 3-day Tokyo trip", text: "Plan a perfect 3-day first-time itinerary for Tokyo." },
  { icon: BookOpen, label: "Summarize a book", text: "Give me a punchy summary of Atomic Habits." },
];

function loadChats(): StoredConvo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChats(chats: StoredConvo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export function ChatApp() {
  const { theme, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState<StoredConvo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loaded = loadChats();
    setChats(loaded);
    if (loaded.length) setActiveId(loaded[0].id);
    // mobile: collapse by default
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (chats.length) saveChats(chats);
  }, [chats]);

  const active = chats.find((c) => c.id === activeId) ?? null;
  const messages = active?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, streamText]);

  const newChat = useCallback(() => {
    setActiveId(null);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const deleteChat = useCallback(
    (id: string) => {
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) setActiveId(null);
    },
    [activeId],
  );

  const send = useCallback(
    async (text: string) => {
      const userMsg: ChatMessageData = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };

      let convoId = activeId;
      let convoMessages: ChatMessageData[] = [];

      if (!convoId) {
        convoId = crypto.randomUUID();
        const newConvo: StoredConvo = {
          id: convoId,
          title: text.slice(0, 40),
          updatedAt: Date.now(),
          messages: [userMsg],
        };
        convoMessages = [userMsg];
        setChats((prev) => [newConvo, ...prev]);
        setActiveId(convoId);
      } else {
        setChats((prev) =>
          prev.map((c) =>
            c.id === convoId
              ? { ...c, messages: [...c.messages, userMsg], updatedAt: Date.now() }
              : c,
          ),
        );
        convoMessages = [...(chats.find((c) => c.id === convoId)?.messages ?? []), userMsg];
      }

      setStreaming(true);
      setStreamText("");
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const resp = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: convoMessages.map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: controller.signal,
        });

        if (!resp.ok || !resp.body) {
          const err = await resp.json().catch(() => ({ error: "Failed" }));
          throw new Error(err.error || "Failed to stream");
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assembled = "";
        let done = false;

        while (!done) {
          const { value, done: d } = await reader.read();
          if (d) break;
          buffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(json);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assembled += delta;
                setStreamText(assembled);
              }
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        const aiMsg: ChatMessageData = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assembled || "(empty response)",
          timestamp: Date.now(),
        };
        setChats((prev) =>
          prev.map((c) =>
            c.id === convoId ? { ...c, messages: [...c.messages, aiMsg] } : c,
          ),
        );
      } catch (e: any) {
        if (e.name !== "AbortError") {
          const errMsg: ChatMessageData = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `⚠️ ${e.message || "Something went wrong."}`,
            timestamp: Date.now(),
          };
          setChats((prev) =>
            prev.map((c) =>
              c.id === convoId ? { ...c, messages: [...c.messages, errMsg] } : c,
            ),
          );
        }
      } finally {
        setStreaming(false);
        setStreamText("");
        abortRef.current = null;
      }
    },
    [activeId, chats],
  );

  const stop = () => abortRef.current?.abort();

  const clearActive = () => {
    if (!activeId) return;
    setChats((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, messages: [] } : c)),
    );
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      {/* Animated mesh background */}
      <div className="pointer-events-none fixed inset-0 gradient-mesh animate-mesh opacity-70" />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={chats.map(({ id, title, updatedAt }) => ({ id, title, updatedAt }))}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          if (window.innerWidth < 768) setSidebarOpen(false);
        }}
        onNew={newChat}
        onDelete={deleteChat}
        theme={theme}
        onToggleTheme={toggle}
      />

      <main className="relative flex h-full flex-1 flex-col">
        {/* Header */}
        <header className="relative z-10 flex h-14 items-center justify-between px-3 sm:px-5">
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {!sidebarOpen && (
                <motion.button
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  onClick={() => setSidebarOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl glass shadow-soft hover:shadow-glow"
                  aria-label="Open sidebar"
                >
                  <PanelLeft className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-semibold">
                {active?.title || "New chat"}
              </span>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearActive}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </header>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="relative z-10 flex-1 overflow-y-auto scrollbar-thin"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-2 py-6 sm:px-4">
            {messages.length === 0 && !streaming ? (
              <Welcome onPick={send} />
            ) : (
              <>
                {messages.map((m) => (
                  <ChatMessage key={m.id} message={m} />
                ))}
                {streaming && streamText && (
                  <ChatMessage
                    message={{
                      id: "stream",
                      role: "assistant",
                      content: streamText,
                      timestamp: Date.now(),
                    }}
                  />
                )}
                {streaming && !streamText && <TypingIndicator />}
              </>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="relative z-10 mx-auto w-full max-w-3xl px-3 pb-4 sm:px-4">
          <ChatInput onSend={send} isStreaming={streaming} onStop={stop} />
        </div>
      </main>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex min-h-[60vh] flex-col items-center justify-center text-center"
    >
      <motion.div
        initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl gradient-primary shadow-glow"
      >
        <Sparkles className="h-7 w-7 text-primary-foreground" />
      </motion.div>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        How can I <span className="gradient-text">help</span> you today?
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Ask anything — Nova can write, brainstorm, code, and explain.
      </p>

      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPick(s.text)}
            className={cn(
              "group flex items-center gap-3 rounded-2xl glass px-4 py-3 text-left text-sm shadow-soft transition-all",
              "hover:shadow-glow hover:border-primary/40",
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              <s.icon className="h-4 w-4" />
            </div>
            <span className="font-medium">{s.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Copy, Check, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type ChatMessageData = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export function ChatMessage({ message }: { message: ChatMessageData }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group flex w-full gap-3 px-2 sm:px-4",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl gradient-primary shadow-glow">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      <div className={cn("flex max-w-[85%] flex-col gap-1.5", isUser && "items-end")}>
        <div
          className={cn(
            "relative rounded-3xl px-4 py-3 text-sm leading-relaxed transition-all",
            "hover:shadow-soft",
            isUser
              ? "rounded-br-lg text-primary-foreground shadow-elegant"
              : "rounded-bl-lg glass text-foreground",
          )}
          style={isUser ? { background: "var(--gradient-bubble-user)" } : undefined}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-pre:my-2 prose-pre:rounded-xl prose-pre:bg-muted prose-code:text-primary">
              <ReactMarkdown>{message.content || "…"}</ReactMarkdown>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-2 px-1 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100",
            isUser ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span>{time}</span>
          <button
            onClick={handleCopy}
            className="rounded-md p-1 transition-colors hover:bg-muted"
            aria-label="Copy message"
          >
            {copied ? (
              <Check className="h-3 w-3 text-primary" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full gap-3 px-2 sm:px-4"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl gradient-primary shadow-glow">
        <Sparkles className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="glass flex items-center gap-1.5 rounded-3xl rounded-bl-lg px-5 py-4">
        <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
        <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
        <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
      </div>
    </motion.div>
  );
}

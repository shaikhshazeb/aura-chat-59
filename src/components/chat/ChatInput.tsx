import { motion } from "framer-motion";
import { ArrowUp, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function ChatInput({
  onSend,
  isStreaming,
  onStop,
}: {
  onSend: (text: string) => void;
  isStreaming: boolean;
  onStop: () => void;
}) {
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const toggleVoice = () => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setValue(text);
    };
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  return (
    <div className="relative w-full">
      <div
        className={cn(
          "glass relative flex items-end gap-2 rounded-3xl p-2 shadow-soft transition-all",
          "focus-within:shadow-glow focus-within:ring-2 focus-within:ring-primary/40",
        )}
      >
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Message Nova…"
          className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none scrollbar-thin"
        />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleVoice}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            listening && "animate-pulse-glow text-primary",
          )}
          aria-label="Voice input"
        >
          <Mic className="h-4 w-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={isStreaming ? onStop : submit}
          disabled={!isStreaming && !value.trim()}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-primary-foreground shadow-elegant transition-all",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
          )}
          style={{ background: "var(--gradient-primary)" }}
          aria-label={isStreaming ? "Stop" : "Send"}
        >
          {isStreaming ? <Square className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
        </motion.button>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Nova can make mistakes. Verify important info.
      </p>
    </div>
  );
}

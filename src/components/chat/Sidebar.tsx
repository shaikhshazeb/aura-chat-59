import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Plus, Sparkles, Sun, Moon, Trash2, X, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type Conversation = {
  id: string;
  title: string;
  updatedAt: number;
};

export function Sidebar({
  open,
  onClose,
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  theme,
  onToggleTheme,
}: {
  open: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {open && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed inset-y-3 left-3 z-40 flex w-[280px] flex-col glass rounded-3xl shadow-elegant md:relative md:inset-auto md:left-0"
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary shadow-glow">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-display text-lg font-semibold tracking-tight">Nova</span>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:flex"
                aria-label="Collapse sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            </div>

            <div className="px-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onNew}
                className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant transition-shadow hover:shadow-glow"
              >
                <Plus className="h-4 w-4" />
                New chat
              </motion.button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto px-2 scrollbar-thin">
              <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recent
              </p>
              <div className="space-y-0.5">
                {conversations.length === 0 && (
                  <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No chats yet
                  </p>
                )}
                {conversations.map((c) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={cn(
                      "group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                      activeId === c.id
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground/80 hover:bg-muted",
                    )}
                    onClick={() => onSelect(c.id)}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="flex-1 truncate">{c.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(c.id);
                      }}
                      className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="border-t border-border/50 p-3">
              <button
                onClick={onToggleTheme}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  {theme === "dark" ? "Dark" : "Light"} mode
                </span>
                <div
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors",
                    theme === "dark" ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                >
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-background shadow",
                      theme === "dark" ? "left-[18px]" : "left-0.5",
                    )}
                  />
                </div>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

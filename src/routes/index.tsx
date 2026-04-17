import { createFileRoute } from "@tanstack/react-router";
import { ChatApp } from "@/components/chat/ChatApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nova — Your AI companion" },
      {
        name: "description",
        content:
          "Nova is a beautifully crafted AI chatbot. Brainstorm, code, learn, and create with a delightful, fast, and modern interface.",
      },
      { property: "og:title", content: "Nova — Your AI companion" },
      {
        property: "og:description",
        content: "A premium AI chat experience with rich animations and dark mode.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <ChatApp />;
}

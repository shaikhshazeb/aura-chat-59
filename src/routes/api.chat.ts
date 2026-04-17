import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const messages = Array.isArray(body?.messages) ? body.messages : null;
          if (!messages) {
            return new Response(JSON.stringify({ error: "messages required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response(
              JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
              { status: 500, headers: { "Content-Type": "application/json" } },
            );
          }

          const response = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [
                  {
                    role: "system",
                    content:
                      "You are Nova, a friendly, brilliant AI assistant. Reply in clean markdown. Be concise but warm. Use code blocks for code.",
                  },
                  ...messages,
                ],
                stream: true,
              }),
            },
          );

          if (!response.ok) {
            if (response.status === 429) {
              return new Response(
                JSON.stringify({
                  error: "Rate limit exceeded. Please try again in a moment.",
                }),
                { status: 429, headers: { "Content-Type": "application/json" } },
              );
            }
            if (response.status === 402) {
              return new Response(
                JSON.stringify({
                  error: "AI credits exhausted. Add credits to your workspace.",
                }),
                { status: 402, headers: { "Content-Type": "application/json" } },
              );
            }
            const text = await response.text();
            return new Response(
              JSON.stringify({ error: text || "AI gateway error" }),
              { status: 500, headers: { "Content-Type": "application/json" } },
            );
          }

          return new Response(response.body, {
            headers: { "Content-Type": "text/event-stream" },
          });
        } catch (e) {
          return new Response(
            JSON.stringify({
              error: e instanceof Error ? e.message : "Unknown error",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});

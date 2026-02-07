import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api, ChatMessage } from "../../../api/client";

interface Props {
  fieldId: number;
  refreshKey?: number;
  onNewMessage?: () => void;
}

export default function ChatMessages({ fieldId, refreshKey = 0, onNewMessage }: Props) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.chat
      .history(token, fieldId)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [token, fieldId, refreshKey]);

  useEffect(() => {
    if (!loading) {
      // scroll to bottom when messages change
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      if (onNewMessage) onNewMessage();
    }
  }, [messages, loading, onNewMessage]);

  return (
    <>
      <style>{`
        .chat-messages-container::-webkit-scrollbar {
          width: 10px;
        }
        .chat-messages-container::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 10px;
        }
        .chat-messages-container::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 10px;
        }
        .chat-messages-container::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }
      `}</style>
      <div className="flex flex-col h-full">
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 chat-messages-container"
          style={{ scrollbarWidth: "auto", scrollbarColor: "#10b981 #f3f4f6" }}
        >
          {loading ? (
            <div className="text-center py-12 text-gray-600 font-medium">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 rounded-2xl glass-card border-gray-200">
              <p className="font-display font-bold text-gray-900">Start the conversation</p>
              <p className="text-sm text-gray-600 mt-2">Ask about irrigation, fertilizers, or daily tasks</p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                <div
                  className={`
                    max-w-[85%] rounded-2xl px-5 py-3
                    ${m.role === "user"
                      ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-br-md shadow-md hover:shadow-lg transition-all duration-300"
                      : "glass-card border-gray-200 text-gray-800 rounded-bl-md hover:border-white/60 transition-all duration-300"}
                  `}
                >
                  <p className="text-sm font-medium whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))
          )}

          <div ref={chatEndRef} />
        </div>
      </div>
    </>
  );
}

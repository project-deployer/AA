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
  const [speakingId, setSpeakingId] = useState<number | null>(null);
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

  const toggleSpeak = (message: ChatMessage) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Voice playback is not supported in this browser.");
      return;
    }
    if (speakingId === message.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = "en-IN";
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(message.id);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      <style>{`
        .chat-messages-container {
          scrollbar-width: thin;
          scrollbar-color: #10b981 #f3f4f6;
        }
        .chat-messages-container::-webkit-scrollbar {
          width: 8px;
        }
        .chat-messages-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-messages-container::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .chat-messages-container::-webkit-scrollbar-thumb:hover {
          background: #059669;
          background-clip: content-box;
        }
      `}</style>
      <div className="h-full flex flex-col min-h-0 overflow-hidden">
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4 chat-messages-container"
          style={{ minHeight: 0 }}
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
                    max-w-[85%] rounded-2xl px-5 py-3 break-words relative
                    ${m.role === "user"
                      ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-br-md shadow-md hover:shadow-lg transition-all duration-300"
                      : "glass-card border-gray-200 text-gray-800 rounded-bl-md hover:border-white/60 transition-all duration-300"}
                  `}
                >
                  <p className="text-sm font-medium whitespace-pre-wrap break-words">{m.content}</p>
                  {m.role === "assistant" && (
                    <button
                      type="button"
                      onClick={() => toggleSpeak(m)}
                      className={`absolute -top-3 -right-3 w-8 h-8 rounded-full border shadow-sm flex items-center justify-center text-xs transition ${
                        speakingId === m.id
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400"
                      }`}
                      title={speakingId === m.id ? "Stop reading" : "Read aloud"}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5l-7 6 7 6V5zm4 2a5 5 0 010 10m2-12a7 7 0 010 14" />
                      </svg>
                    </button>
                  )}
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

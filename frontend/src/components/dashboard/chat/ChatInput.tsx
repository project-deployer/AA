import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../api/client";

interface Props {
  fieldId: number;
  onSent?: () => void;
}

export default function ChatInput({ fieldId, onSent }: Props) {
  const { token } = useAuth();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  const submitMessage = async () => {
    const text = input.trim();
    if (!text || !token || loading) return;
    setLoading(true);
    setInput("");
    try {
      await api.chat.send(token, fieldId, text);
      onSent?.();
    } catch (err) {
      console.error(err);
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-end gap-2 p-3 rounded-2xl glass-panel border-gray-200 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-300 transition-all shadow-md">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message AgriAI..."
          rows={1}
          className="flex-1 min-h-[44px] max-h-[120px] py-3 px-4 bg-transparent text-gray-900 placeholder-gray-400 resize-none outline-none text-base font-medium"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center shadow-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">AgriAI can make mistakes. Check important info.</p>
    </form>
  );
}

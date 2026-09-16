"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type MessageComposerProps = {
  conversationId: string;
  onSendMessage: (content: string) => Promise<boolean>;
  disabled?: boolean;
};

export function MessageComposer({
  conversationId,
  onSendMessage,
  disabled = false,
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when conversation changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [conversationId]);

  // Auto-resize textarea
  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = Math.min(el.scrollHeight, 140);
    el.style.height = `${nextHeight}px`;
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSubmitting || disabled) return;

    setIsSubmitting(true);
    // Clear input right away for responsive snappy UX
    const saved = content;
    setContent("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const success = await onSendMessage(trimmed);
      if (!success) {
        // Restore if failed
        setContent(saved);
      }
    } catch {
      setContent(saved);
    } finally {
      setIsSubmitting(false);
      // Re-focus after sending
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = content.trim().length > 0 && !isSubmitting && !disabled;

  return (
    <div className="border-t border-white/10 p-3 bg-card/60 backdrop-blur-sm shrink-0">
      <div className="flex items-end gap-2 bg-muted/40 border border-white/10 rounded-xl p-1.5 focus-within:ring-1 focus-within:ring-white/20 transition-all">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Press Enter to send, Shift+Enter for newline)"
          rows={1}
          disabled={disabled || isSubmitting}
          className="min-h-9 max-h-36 resize-none border-0 bg-transparent py-2 px-3 text-xs leading-relaxed shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
        />

        <Button
          type="button"
          size="icon"
          disabled={!canSend}
          onClick={handleSend}
          className={`size-8 shrink-0 cursor-pointer rounded-lg transition-all ${
            canSend
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "opacity-40"
          }`}
          aria-label="Send message"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

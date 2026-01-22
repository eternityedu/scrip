import * as React from "react";
import { Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SwipeToDeleteCardProps = {
  children: React.ReactNode;
  onDelete: () => void | Promise<void>;
  /** Width of the revealed action area in px */
  actionWidth?: number;
  /** When true, disables swipe interaction */
  disabled?: boolean;
  className?: string;
  actionLabel?: string;
};

export function SwipeToDeleteCard({
  children,
  onDelete,
  actionWidth = 84,
  disabled,
  className,
  actionLabel = "Delete",
}: SwipeToDeleteCardProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const start = React.useRef<{ x: number; y: number } | null>(null);
  const dragging = React.useRef(false);

  const [offset, setOffset] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const close = React.useCallback(() => {
    setIsOpen(false);
    setOffset(0);
  }, []);

  const open = React.useCallback(() => {
    setIsOpen(true);
    setOffset(-actionWidth);
  }, [actionWidth]);

  const handleDelete = React.useCallback(async () => {
    await onDelete();
    close();
  }, [close, onDelete]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onDocDown = (e: PointerEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener("pointerdown", onDocDown);
    return () => document.removeEventListener("pointerdown", onDocDown);
  }, [close, isOpen]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    // Keep mouse behavior as-is on desktop; still allow trackpad/mouse if desired.
    start.current = { x: e.clientX, y: e.clientY };
    dragging.current = false;
    setIsDragging(false);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (disabled) return;
    if (!start.current) return;

    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;

    // Decide gesture direction once.
    if (!dragging.current) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        // vertical scroll wins
        start.current = null;
        dragging.current = false;
        return;
      }
      dragging.current = true;
      setIsDragging(true);
    }

    // Prevent page scroll while swiping horizontally.
    e.preventDefault();

    const base = isOpen ? -actionWidth : 0;
    const next = clamp(base + dx, -actionWidth * 1.4, 0);
    setOffset(next);
  };

  const onPointerUp = () => {
    if (!start.current) return;
    start.current = null;
    const wasDragging = dragging.current;
    dragging.current = false;
    setIsDragging(false);

    if (!wasDragging) {
      // Tap closes if open.
      if (isOpen) close();
      return;
    }

    // Quick swipe past threshold triggers delete.
    if (offset <= -actionWidth * 1.05) {
      void handleDelete();
      return;
    }

    // Snap open/closed.
    if (offset <= -actionWidth * 0.5) open();
    else close();
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={{ touchAction: "pan-y" }}
    >
      {/* Revealed actions */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-destructive"
        style={{ width: actionWidth }}
        aria-hidden
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-destructive-foreground hover:bg-destructive/80"
          onClick={() => void handleDelete()}
          aria-label={actionLabel}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Swipeable content */}
      <div
        className={cn(
          "relative will-change-transform",
          !isDragging && "transition-transform duration-200 ease-out"
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {children}
      </div>
    </div>
  );
}

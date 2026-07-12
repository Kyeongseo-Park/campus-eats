"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

export function BottomSheet({
  expanded,
  onExpandedChange,
  heightVh,
  peekPx = 96,
  children,
}: {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  heightVh: number;
  peekPx?: number;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ startY: number; startTranslate: number; maxTranslate: number } | null>(null);
  const [dragTranslate, setDragTranslate] = useState<number | null>(null);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (!container) return;

    const height = container.getBoundingClientRect().height;
    const maxTranslate = Math.max(height - peekPx, 0);
    const startTranslate = expanded ? 0 : maxTranslate;

    dragStateRef.current = { startY: event.clientY, startTranslate, maxTranslate };
    setDragTranslate(startTranslate);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState) return;

    const delta = event.clientY - dragState.startY;
    const next = Math.min(Math.max(dragState.startTranslate + delta, 0), dragState.maxTranslate);
    setDragTranslate(next);
  }

  function handlePointerUp() {
    const dragState = dragStateRef.current;
    if (!dragState) return;

    const current = dragTranslate ?? dragState.startTranslate;
    const midpoint = dragState.maxTranslate / 2;
    onExpandedChange(current <= midpoint);

    dragStateRef.current = null;
    setDragTranslate(null);
  }

  const isDragging = dragTranslate !== null;
  const transform = isDragging
    ? `translateY(${dragTranslate}px)`
    : expanded
      ? "translateY(0)"
      : `translateY(calc(100% - ${peekPx}px))`;

  return (
    <div
      ref={containerRef}
      className="absolute inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-2xl bg-background shadow-[0_-4px_16px_rgba(0,0,0,0.12)] ring-1 ring-foreground/10"
      style={{
        height: `${heightVh}vh`,
        transform,
        transition: isDragging ? "height 200ms ease-out" : "height 200ms ease-out, transform 200ms ease-out",
      }}
    >
      <div
        className="flex shrink-0 cursor-grab touch-none flex-col items-center py-2 active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 pb-3">{children}</div>
    </div>
  );
}

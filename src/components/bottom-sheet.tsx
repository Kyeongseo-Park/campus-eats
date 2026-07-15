"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";

export function BottomSheet({
  expanded,
  onExpandedChange,
  restingOffsetVh,
  contentRef,
  children,
}: {
  /** true면 목록이 전체화면까지 확장된 상태, false면 지도가 보이는 기본(resting) 상태. */
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** 기본(resting) 위치에서 시트 상단이 위치할 지점(dvh) — 이 값만큼 위쪽에 지도가 보인다. */
  restingOffsetVh: number;
  /** 스크롤 가능한 콘텐츠 영역(dev)에 대한 ref — 호출부에서 스크롤 위치를 저장/복원하는 데 쓴다. */
  contentRef?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ startY: number; startTranslate: number; maxTranslate: number } | null>(null);
  const [dragTranslate, setDragTranslate] = useState<number | null>(null);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (!container) return;

    const maxTranslate = (container.getBoundingClientRect().height * restingOffsetVh) / 100;
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
      : `translateY(${restingOffsetVh}dvh)`;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-30 flex flex-col overflow-hidden rounded-t-md bg-background shadow-[0_-4px_16px_rgba(0,0,0,0.12)] ring-1 ring-foreground/10"
      style={{
        transform,
        transition: isDragging ? "none" : "transform 200ms ease-out",
      }}
    >
      {/* 핸들 바 영역에서만 포인터 이벤트를 잡는다 — 목록 스크롤(아래 overflow-y-auto 영역)과
          시트 드래그가 서로 간섭하지 않도록 분리한다. */}
      <div
        className="flex shrink-0 cursor-grab touch-none flex-col items-center py-2 active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
      </div>
      <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 pb-3">
        {children}
      </div>
    </div>
  );
}

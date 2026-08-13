"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";

export type SheetState = "expanded" | "default" | "collapsed";

// 핸들바를 눌렀다 뗀 거리(px)가 이 값 이하이면 드래그가 아니라 "탭"으로 간주해
// 다음 상태로 순환 전환한다.
const TAP_THRESHOLD_PX = 5;

export function BottomSheet({
  state,
  onStateChange,
  defaultOffsetVh,
  collapsedOffsetVh,
  contentRef,
  children,
}: {
  /** "expanded"=목록 전체화면, "default"=지도가 보이는 기본 위치, "collapsed"=핸들바만 남고 접힌 위치. */
  state: SheetState;
  onStateChange: (state: SheetState) => void;
  /** "default" 상태에서 시트 상단이 위치할 지점(시트 자신의 높이 대비 %). */
  defaultOffsetVh: number;
  /** "collapsed" 상태에서 시트 상단이 위치할 지점(시트 자신의 높이 대비 %) — 100에 가까울수록 핸들바만 남는다. */
  collapsedOffsetVh: number;
  /** 스크롤 가능한 콘텐츠 영역(dev)에 대한 ref — 호출부에서 스크롤 위치를 저장/복원하는 데 쓴다. */
  contentRef?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ startY: number; startTranslate: number; containerHeight: number; moved: boolean } | null>(
    null
  );
  const [dragTranslate, setDragTranslate] = useState<number | null>(null);

  function offsetPxForState(s: SheetState, containerHeight: number) {
    const vh = s === "expanded" ? 0 : s === "default" ? defaultOffsetVh : collapsedOffsetVh;
    return (containerHeight * vh) / 100;
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (!container) return;

    const containerHeight = container.getBoundingClientRect().height;
    const startTranslate = offsetPxForState(state, containerHeight);

    dragStateRef.current = { startY: event.clientY, startTranslate, containerHeight, moved: false };
    setDragTranslate(startTranslate);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState) return;

    const delta = event.clientY - dragState.startY;
    if (Math.abs(delta) > TAP_THRESHOLD_PX) dragState.moved = true;

    const maxTranslate = offsetPxForState("collapsed", dragState.containerHeight);
    const next = Math.min(Math.max(dragState.startTranslate + delta, 0), maxTranslate);
    setDragTranslate(next);
  }

  function handlePointerUp() {
    const dragState = dragStateRef.current;
    if (!dragState) return;

    if (!dragState.moved) {
      // 드래그 없이 탭만 한 경우: 접힘 → 기본 → 펼침 → 접힘 순서로 순환한다.
      const nextState: SheetState =
        state === "collapsed" ? "default" : state === "default" ? "expanded" : "collapsed";
      onStateChange(nextState);
    } else {
      const current = dragTranslate ?? dragState.startTranslate;
      const expandedOffset = 0;
      const defaultOffset = offsetPxForState("default", dragState.containerHeight);
      const collapsedOffset = offsetPxForState("collapsed", dragState.containerHeight);
      const expandedToDefaultMid = (expandedOffset + defaultOffset) / 2;
      const defaultToCollapsedMid = (defaultOffset + collapsedOffset) / 2;

      const nextState: SheetState =
        current <= expandedToDefaultMid ? "expanded" : current <= defaultToCollapsedMid ? "default" : "collapsed";
      onStateChange(nextState);
    }

    dragStateRef.current = null;
    setDragTranslate(null);
  }

  const isDragging = dragTranslate !== null;
  const restingOffsetVh = state === "expanded" ? 0 : state === "default" ? defaultOffsetVh : collapsedOffsetVh;
  const transform = isDragging ? `translateY(${dragTranslate}px)` : `translateY(${restingOffsetVh}%)`;

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
          시트 드래그가 서로 간섭하지 않도록 분리한다. 탭하면 다음 상태로 순환 전환된다. */}
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

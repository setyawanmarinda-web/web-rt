'use client';

import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { layoutEdit, useEditing, useResetVersion } from '@/lib/layoutEdit';

export function sanitizeOrder(saved: unknown, ids: string[]): string[] {
  const arr = Array.isArray(saved)
    ? saved.filter((x): x is string => typeof x === 'string' && ids.includes(x))
    : [];
  const unique = Array.from(new Set(arr));
  const rest = ids.filter((id) => !unique.includes(id));
  return [...unique, ...rest];
}

export function useLongPressEdit(enabled: boolean) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const start = useRef({ x: 0, y: 0 });

  function clear() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (!enabled) return;
      fired.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      clear();
      timer.current = setTimeout(() => {
        timer.current = null;
        fired.current = true;
        layoutEdit.setEditing(true);
      }, 500);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (
        timer.current &&
        Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 8
      ) {
        clear();
      }
    },
    onPointerUp: () => {
      clear();
      if (fired.current) {
        setTimeout(() => {
          fired.current = false;
        }, 60);
      }
    },
    onPointerLeave: clear,
    onPointerCancel: clear,
    onClickCapture: (e: React.MouseEvent) => {
      if (fired.current) {
        e.preventDefault();
        e.stopPropagation();
        fired.current = false;
      }
    },
    onContextMenu: (e: React.MouseEvent) => {
      if (fired.current) e.preventDefault();
    },
  };
}

export function LayoutEditBar() {
  const editing = useEditing();

  useEffect(() => {
    if (!editing) return;
    document.body.classList.add('lo-editing');

    let down = { x: 0, y: 0, t: 0 };
    let lastTap = 0;

    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, t: Date.now() };
    };
    const onUp = (e: PointerEvent) => {
      const now = Date.now();
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      if (moved > 10 || now - down.t > 350) {
        lastTap = 0;
        return;
      }
      if (now - layoutEdit.getStartedAt() < 800) return;
      if (now - lastTap < 400) {
        lastTap = 0;
        layoutEdit.setEditing(false);
      } else {
        lastTap = now;
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') layoutEdit.setEditing(false);
    };

    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('pointerup', onUp, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('lo-editing');
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('pointerup', onUp, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [editing]);

  return (
    <>
      <style>{`
        @keyframes lo-jiggle {
          from { transform: rotate(-0.8deg); }
          to { transform: rotate(0.8deg); }
        }
        .lo-jiggle { animation: lo-jiggle 0.28s ease-in-out infinite alternate; }
        .lo-editing { touch-action: manipulation; -webkit-user-select: none; user-select: none; }
        .lo-flow { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.5rem; }
        .lo-flow.lo-m2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .lo-cell { grid-column: 1 / -1; min-width: 0; }
        .lo-flow.lo-m2 > .lo-cell.lo-small { grid-column: span 1 / span 1; }
        .lo-flow > .lo-cell > div > .lo-body > * { height: 100%; }
        @media (min-width: 640px) {
          .lo-flow { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .lo-cell.lo-small { grid-column: span 1 / span 1; }
        }
        @media (min-width: 1024px) {
          .lo-flow, .lo-flow.lo-m2 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
          .lo-cell, .lo-cell.lo-small, .lo-flow.lo-m2 > .lo-cell.lo-small {
            grid-column: span var(--lo-span, 12) / span var(--lo-span, 12);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .lo-jiggle { animation: none; }
        }
      `}</style>
      {editing && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 rounded-full bg-slate-900 border border-emerald-500/40 px-4 py-2 text-xs text-slate-200 shadow-2xl">
          <span>Seret untuk atur. Klik 2x di mana saja untuk selesai.</span>
          <button
            type="button"
            onClick={() => layoutEdit.resetAll()}
            className="font-semibold text-amber-400 hover:text-amber-300"
          >
            Reset
          </button>
        </div>
      )}
    </>
  );
}

function computeSpans(order: string[], widths: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  let row: string[] = [];
  let total = 0;

  const flush = () => {
    if (!row.length) return;
    let used = 0;
    row.forEach((id, i) => {
      const span =
        i === row.length - 1
          ? Math.max(1, 12 - used)
          : Math.max(1, Math.round((widths[id] * 12) / total));
      result[id] = span;
      used += span;
    });
    row = [];
    total = 0;
  };

  for (const id of order) {
    const w = widths[id];
    if (total + w > 12) flush();
    row.push(id);
    total += w;
  }
  flush();
  return result;
}

type GroupProps = {
  attr: string;
  storageKey: string;
  layout?: 'stack' | 'grid' | 'flow';
  className?: string;
  gap?: string;
  mobile2?: boolean;
  children: ReactNode;
};

export function SortGroup({
  attr,
  storageKey,
  layout = 'stack',
  className,
  gap,
  mobile2,
  children,
}: GroupProps) {
  const resetVersion = useResetVersion();
  const seenReset = useRef(resetVersion);

  const items = React.Children.toArray(children).filter(
    React.isValidElement,
  ) as React.ReactElement<Record<string, unknown>>[];
  const sortable = items.filter((el) => Boolean(el.props[attr]));
  const statics = items.filter((el) => !el.props[attr]);

  const defaultIds = sortable.map((el) => String(el.props[attr]));
  const idsKey = defaultIds.join('|');

  const [order, setOrder] = useState<string[]>(defaultIds);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setOrder(sanitizeOrder(raw ? JSON.parse(raw) : null, defaultIds));
    } catch {
      setOrder(defaultIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, idsKey]);

  useEffect(() => {
    if (resetVersion === seenReset.current) return;
    seenReset.current = resetVersion;
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setOrder(defaultIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetVersion]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = order.indexOf(String(active.id));
    const to = order.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const next = arrayMove(order, from, to);
    setOrder(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  }

  const byId = new Map(sortable.map((el) => [String(el.props[attr]), el]));
  const widths: Record<string, number> = {};
  const notSmall: Record<string, boolean> = {};
  sortable.forEach((el) => {
    const id = String(el.props[attr]);
    const w = Number(el.props['data-lo-w']);
    widths[id] = w >= 1 && w <= 12 ? Math.round(w) : 12;
    notSmall[id] = el.props['data-lo-s'] === 'n';
  });
  const spans =
    layout === 'flow' ? computeSpans(order.filter((id) => byId.has(id)), widths) : null;

  const strategy = layout === 'stack' ? verticalListSortingStrategy : rectSortingStrategy;
  const baseClass = className ?? (layout === 'stack' ? 'space-y-6 sm:space-y-8' : '');
  const containerClass = `${layout === 'flow' ? 'lo-flow ' : ''}${
    layout === 'flow' && mobile2 ? 'lo-m2 ' : ''
  }${baseClass}`;

  return (
    <DndContext
      id={storageKey}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={order} strategy={strategy}>
        <div className={containerClass} style={layout === 'flow' && gap ? { gap } : undefined}>
          {order.map((id, index) => {
            const el = byId.get(id);
            if (!el) return null;
            return (
              <SortItem
                key={id}
                id={id}
                index={index}
                flow={
                  spans
                    ? { span: spans[id] ?? 12, small: widths[id] <= 4 && !notSmall[id] }
                    : undefined
                }
              >
                {el}
              </SortItem>
            );
          })}
        </div>
        {statics}
      </SortableContext>
    </DndContext>
  );
}

function SortItem({
  id,
  index,
  flow,
  children,
}: {
  id: string;
  index: number;
  flow?: { span: number; small: boolean };
  children: ReactNode;
}) {
  const editing = useEditing();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !editing,
  });
  const lp = useLongPressEdit(!editing);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 20 : undefined,
    ...(flow ? { '--lo-span': flow.span } : {}),
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`min-w-0 ${flow ? `lo-cell${flow.small ? ' lo-small' : ''}` : ''} ${
        editing ? 'pointer-events-auto touch-none cursor-grab active:cursor-grabbing select-none' : ''
      }`}
      {...(editing ? { ...attributes, ...listeners } : lp)}
    >
      <div
        className={`relative ${flow ? 'h-full' : ''} ${
          editing ? 'lo-jiggle rounded-2xl ring-1 ring-emerald-500/30' : ''
        } ${isDragging ? 'opacity-90 ring-2 ring-emerald-400' : ''}`}
        style={editing ? { animationDelay: `${-index * 0.07}s` } : undefined}
      >
        <div className={`lo-body ${flow ? 'h-full' : ''} ${editing ? 'pointer-events-none' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

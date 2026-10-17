'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, LayoutGrid, RotateCcw } from 'lucide-react';

type Item = { id: string; label: string };

const BLOCKS: Item[] = [
  { id: 'metric', label: 'Ringkasan Saldo per Pos' },
  { id: 'forms', label: 'Form Catat Transaksi & Simpan Pinjam' },
  { id: 'mutasi', label: 'Riwayat Mutasi Transaksi' },
  { id: 'simpin', label: 'Riwayat Simpan Pinjam' },
];

const CARDS: Item[] = [
  { id: 'kasrt', label: '1. Kas RT' },
  { id: 'sampah', label: '2. Sampah & Keamanan' },
  { id: 'dansos', label: '3. Dana Sosial' },
  { id: 'simpinjam', label: '4. Simpan Pinjam' },
  { id: 'dana17', label: '5. Dana 17an' },
];

const BLOCK_DEFAULT = BLOCKS.map((b) => b.id);
const CARD_DEFAULT = CARDS.map((c) => c.id);

function sanitize(saved: unknown, defaults: string[]): string[] {
  const arr = Array.isArray(saved)
    ? saved.filter((x): x is string => typeof x === 'string' && defaults.includes(x))
    : [];
  const unique = Array.from(new Set(arr));
  const rest = defaults.filter((id) => !unique.includes(id));
  return [...unique, ...rest];
}

function useOrder(key: string, defaults: string[]) {
  const [order, setOrder] = useState<string[]>(defaults);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setOrder(sanitize(JSON.parse(raw), defaults));
    } catch {}
  }, [key, defaults]);

  function save(next: string[]) {
    setOrder(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  }

  return { order, save };
}

function Row({ item }: { item: Item }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-slate-800 border rounded-xl px-3 py-3 ${
        isDragging ? 'border-emerald-500 shadow-lg' : 'border-slate-700'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing text-slate-400 hover:text-emerald-400 p-1"
        aria-label={`Geser ${item.label}`}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <span className="text-sm font-medium text-slate-100">{item.label}</span>
    </li>
  );
}

function SortableList({
  items,
  order,
  onChange,
}: {
  items: Item[];
  order: string[];
  onChange: (next: string[]) => void;
}) {
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
    onChange(arrayMove(order, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {order.map((id) => {
            const item = items.find((i) => i.id === id);
            return item ? <Row key={id} item={item} /> : null;
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

export default function KasLayoutEditor() {
  const blocks = useOrder('kas-layout-v1', BLOCK_DEFAULT);
  const cards = useOrder('kas-cards-v1', CARD_DEFAULT);
  const [open, setOpen] = useState(false);

  const orderCss =
    blocks.order.map((id, i) => `[data-kas-block="${id}"]{order:${(i + 1) * 10}}`).join('') +
    cards.order.map((id, i) => `[data-kas-card="${id}"]{order:${(i + 1) * 10}}`).join('');

  return (
    <>
      <style>{`div:has(> [data-kas-block]){display:flex;flex-direction:column;gap:1.5rem}div:has(> [data-kas-block])>*{margin:0!important;min-width:0}${orderCss}`}</style>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 text-xs font-semibold transition-all"
        >
          <LayoutGrid className="w-4 h-4" />
          Atur Tampilan
        </button>
      </div>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-base font-bold text-white">Atur Tampilan</h2>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Tarik pegangan ⋮⋮ untuk ubah urutan. Tersimpan otomatis di browser ini.
              </p>

              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Blok Halaman
              </h3>
              <SortableList items={BLOCKS} order={blocks.order} onChange={blocks.save} />

              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-5 mb-2">
                Kartu Saldo per Pos
              </h3>
              <SortableList items={CARDS} order={cards.order} onChange={cards.save} />

              <div className="flex items-center justify-between mt-5">
                <button
                  type="button"
                  onClick={() => {
                    blocks.save(BLOCK_DEFAULT);
                    cards.save(CARD_DEFAULT);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset urutan
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

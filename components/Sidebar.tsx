'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import {
  Wallet, Calendar, Megaphone, ShoppingBag,
  BarChart3, FolderArchive, FileText, FileSpreadsheet, Settings, Package,
  Shield, X, GripVertical, Trophy
} from 'lucide-react';
import { useScope, roleLabel, canSeeMenu } from '@/lib/scope';
import { LayoutEditBar, sanitizeOrder, useLongPressEdit } from '@/components/LayoutEdit';
import { useEditing, useResetVersion } from '@/lib/layoutEdit';

interface SidebarProps {
  selectedRt: string;
  onRtChange: (rt: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const MENU_ITEMS = [
  { href: '/dashboard/kas', label: 'Kas & Iuran Warga', icon: Wallet },
  { href: '/dashboard/kegiatan', label: 'Agenda Kegiatan', icon: Calendar },
  { href: '/dashboard/17an', label: 'Agenda 17an', icon: Trophy },
  { href: '/dashboard/pengumuman', label: 'Pengumuman', icon: Megaphone },
  { href: '/dashboard/surat', label: 'Layanan Surat', icon: FileText },
  { href: '/dashboard/statistik', label: 'Statistik Warga', icon: BarChart3 },
  { href: '/dashboard/arsip', label: 'Arsip Digital', icon: FolderArchive },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Package },
  { href: '/dashboard/umkm', label: 'Direktori UMKM', icon: ShoppingBag },
  { href: '/dashboard/laporan', label: 'Dashboard', icon: FileSpreadsheet },
  { href: '/dashboard/pengaturan', label: 'Pengaturan System', icon: Settings },
];

type MenuItem = (typeof MENU_ITEMS)[number];

const DEFAULT_ORDER = MENU_ITEMS.map((m) => m.href);
const STORAGE_KEY = 'sidebar-menu-v2';

function EditRow({ item, index }: { item: MenuItem; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.href });
  const Icon = item.icon;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
        position: 'relative',
      }}
    >
      <div
        {...attributes}
        {...listeners}
        style={{ animationDelay: `${-index * 0.07}s` }}
        className={`lo-jiggle touch-none cursor-grab active:cursor-grabbing flex items-center justify-between px-3 py-3 md:py-2.5 rounded-xl md:rounded-lg text-sm font-medium border select-none ${
          isDragging
            ? 'bg-slate-800 border-emerald-500 text-white shadow-lg'
            : 'bg-slate-800/60 border-emerald-500/30 text-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 md:w-4 md:h-4 text-slate-400" />
          <span>{item.label}</span>
        </div>
        <GripVertical className="w-4 h-4 text-emerald-400" />
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  isActive,
  onClick,
}: {
  item: MenuItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  const lp = useLongPressEdit(true);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      draggable={false}
      onClick={onClick}
      {...lp}
      className={`flex items-center justify-between px-3 py-3 md:py-2.5 rounded-xl md:rounded-lg text-sm font-medium transition-all ${
        isActive
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-inner'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 md:w-4 md:h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
        <span>{item.label}</span>
      </div>
    </Link>
  );
}

export default function Sidebar({ selectedRt, onRtChange, isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { options: scopeOptions, locked, user: scopeUser } = useScope();
  const editing = useEditing();
  const resetVersion = useResetVersion();
  const seenReset = useRef(resetVersion);
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOrder(sanitizeOrder(JSON.parse(raw), DEFAULT_ORDER));
    } catch {}
  }, []);

  useEffect(() => {
    if (resetVersion === seenReset.current) return;
    seenReset.current = resetVersion;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setOrder(DEFAULT_ORDER);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  const menuItems = order
    .map((href) => MENU_ITEMS.find((m) => m.href === href))
    .filter((m): m is MenuItem => Boolean(m))
    .filter((m) => canSeeMenu(scopeUser, m.href));

  return (
    <>
      <LayoutEditBar />

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen fixed md:sticky top-0 left-0 z-50 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header with Close button on Mobile */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Link href="/" title="Ke Halaman Publik RW" className="flex items-center gap-3 rounded-lg hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm tracking-wide">Panel RT & RW 012</h2>
              <p className="text-xs text-emerald-400 font-medium">Kelurahan Bahagia</p>
            </div>
          </Link>

          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector RT active scope (RT 001 - RT 010, default RT 002) */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {locked ? 'RT Anda:' : 'Scope RT Aktif:'}
          </label>
          <select
            value={selectedRt}
            onChange={(e) => onRtChange(e.target.value)}
            disabled={locked}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer transition-colors"
          >
            {scopeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Menu List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {editing ? (
            <DndContext
              id="sidebar-menu"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext items={order} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {menuItems.map((item, index) => (
                    <EditRow key={item.href} item={item} index={index} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            menuItems.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                onClick={onMobileClose}
              />
            ))
          )}
        </div>

        {/* Footer Profile Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400 flex-shrink-0">
              RT
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{scopeUser?.name || 'Pengurus'}</p>
              <p className="text-[11px] text-slate-400 truncate">Hak Akses: {roleLabel(scopeUser)}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

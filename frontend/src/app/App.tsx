import { useState, useEffect, useCallback, useRef } from "react";
import logoKabupatenMadiun from "../assets/logo-kabupaten-madiun.gif";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  ClipboardList,
  BarChart3,
  Award,
  FileText,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Search,
  Filter,
  Eye,
  Check,
  XCircle,
  Upload,
  Download,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Phone,
  BookOpen,
  Fingerprint,
  Star,
  Send,
  ArrowLeft,
  ArrowRight,
  Home,
  UserCircle,
  Briefcase,
  Loader2,
  Inbox,
  Megaphone,
  Archive,
  RotateCcw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  api,
  apiErrorMessage,
  setOnUnauthorized,
  openAuthenticatedFile,
} from "./lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "admin" | "calon" | "peserta";
type AdminPage =
  | "dashboard"
  | "pendaftar"
  | "verifikasi"
  | "divisi"
  | "presensi"
  | "monitoring"
  | "absensi-riwayat"
  | "review-laporan"
  | "rekomendasi"
  | "peserta-detail"
  | "sertifikat"
  | "laporan"
  | "pengumuman"
  | "profil";
type CalonPage = "dashboard" | "pendaftaran" | "profil";
type PesertaPage = CalonPage | "laporan-peserta" | "sertifikat-peserta";
type Page = AdminPage | CalonPage | PesertaPage;

// ─── API Data Types ─────────────────────────────────────────────────────────
// Seluruh data di bawah ini sekarang datang dari Laravel API (bukan mock lagi).
// Bentuk (shape) tiap tipe mengikuti App\Http\Resources\* di backend.

type NotifikasiItem = {
  id: number;
  judul: string;
  pesan: string;
  halaman: string | null;
  pendaftaran_id: number | null;
  dibaca: boolean;
  waktu: string;
  tanggal: string;
};
type Divisi = { id: number; nama: string; kuota: number; sisa_kuota: number };
type PengumumanItem = {
  id: number;
  judul: string;
  isi: string;
  status: string;
  dibuat_oleh: string | null;
  dibuat_pada: string;
  diarsipkan_pada: string | null;
};
type PendaftarItem = {
  id: number;
  nama: string;
  nim: string;
  tanggal_lahir: string | null;
  semester: string;
  institusi: string;
  jurusan: string;
  no_hp: string;
  divisi: string;
  divisi_id: number;
  peserta_magang_id: number | null;
  peserta_magang_divisi_id: number | null;
  periode: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  motivasi: string | null;
  tanggal: string;
  status: string;
  batas_pengumuman: string;
  sisa_hari_pengumuman: number | null;
  catatan_admin: string | null;
  dokumen_dikirim: boolean;
  sudah_ditempatkan: boolean | null;
  dokumen?: DokumenItem[];
};
type DokumenItem = {
  id: number;
  pendaftaran_id: number;
  nama: string;
  status: string;
  catatan: string | null;
  file_url: string | null;
  file_name: string | null;
};
type PesertaItem = {
  id: number;
  nama: string;
  institusi: string;
  divisi: string;
  divisi_id: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  hari_berjalan: number;
  total_hari: number;
  hadir: number;
  total_absensi: number;
  persen: number;
  status: string;
};
type RekapHari = {
  hari: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_keluar: string | null;
};
type RekapMinggu = {
  minggu: number;
  periode: string;
  hari: RekapHari[];
};
type RekapKejadian = {
  tanggal: string;
  hari: string;
  status: string;
  keterangan: string | null;
};
type RekapAbsensiData = {
  peserta: {
    id: number;
    nama: string;
    divisi: string;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
  };
  mingguan: RekapMinggu[];
  izin_sakit_terlambat: RekapKejadian[];
};
type AbsensiItem = {
  id: number;
  peserta_magang_id: number;
  nama: string;
  divisi: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_keluar: string | null;
  status: string;
  diverifikasi: boolean;
  hari?: string;
  sift?: string | null;
  keterangan?: string | null;
  bukti_url?: string | null;
  di_luar_jam?: boolean;
};
type LaporanItem = {
  id: number;
  peserta_magang_id: number;
  peserta: string;
  judul: string;
  tanggal: string;
  isi: string;
  status: string;
  catatan_pembimbing: string | null;
};
type RekomendasiItem = {
  id: number;
  diberikan_oleh: string;
  kedisiplinan: number;
  teknis: number;
  sikap: number;
  inisiatif: number;
  rata_rata: number;
  catatan: string | null;
  tanggal: string;
};
type SertifikatItem = {
  id: number;
  peserta_magang_id: number;
  nama: string;
  divisi: string;
  nomor: string;
  status: string;
  tanggal_terbit: string | null;
  file_url: string | null;
};

// ─── Loading / Empty / Error state helpers ─────────────────────────────────
// Dipakai konsisten di semua halaman yang mengambil data dari API.

function LoadingState({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-[#6B7770]">
      <Loader2 size={22} className="animate-spin mb-2" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function EmptyState({ label = "Belum ada data." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-[#6B7770]">
      <Inbox size={28} className="mb-2 opacity-40" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <AlertCircle size={16} /> {message}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-[#1B4332] hover:underline"
        >
          Coba lagi
        </button>
      )}
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function StatusBadge({
  status,
  labelOverride,
}: {
  status: string;
  labelOverride?: string;
}) {
  const map: Record<string, { label: string; cls: string }> = {
    disetujui: { label: "Disetujui", cls: "bg-[#D1FAE5] text-[#1B4332]" },
    aktif: { label: "Aktif", cls: "bg-[#D1FAE5] text-[#1B4332]" },
    baik: { label: "Baik", cls: "bg-[#D1FAE5] text-[#1B4332]" },
    terverifikasi: {
      label: "Terverifikasi",
      cls: "bg-[#D1FAE5] text-[#1B4332]",
    },
    selesai: { label: "Selesai", cls: "bg-[#D1FAE5] text-[#1B4332]" },
    menunggu: { label: "Menunggu", cls: "bg-amber-100 text-amber-800" },
    belum_ada_data: {
      label: "Belum Ada Data",
      cls: "bg-gray-100 text-gray-500",
    },
    perhatian: { label: "Perlu Perhatian", cls: "bg-amber-100 text-amber-800" },
    "belum-review": {
      label: "Belum Direview",
      cls: "bg-amber-100 text-amber-800",
    },
    ditolak: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
    kedaluwarsa: { label: "Kedaluwarsa", cls: "bg-gray-200 text-gray-600" },
    diarsipkan: { label: "Diarsipkan", cls: "bg-gray-200 text-gray-600" },
    nonaktif: { label: "Nonaktif", cls: "bg-red-100 text-red-700" },
    "perlu-revisi": { label: "Perlu Revisi", cls: "bg-red-100 text-red-700" },
    "belum-upload": { label: "Belum Upload", cls: "bg-gray-100 text-gray-500" },
  };
  const cfg = map[status] ?? {
    label: status,
    cls: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
        cfg.cls,
      )}
    >
      {labelOverride ?? cfg.label}
    </span>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-[#1B4332]/10 p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="flex items-start gap-4">
      <div className={cn("p-3 rounded-xl", color)}>{icon}</div>
      <div>
        <p className="text-xs text-[#6B7770] font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-[#1B4332] mt-0.5">{value}</p>
        {sub && <p className="text-xs text-[#6B7770] mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

type NavItem = { icon: React.ReactNode; label: string; page: Page };

function getNavItems(role: Role): NavItem[] {
  if (role === "admin") {
    return [
      {
        icon: <LayoutDashboard size={18} />,
        label: "Dashboard",
        page: "dashboard",
      },
      { icon: <Users size={18} />, label: "Data Pendaftar", page: "pendaftar" },
      {
        icon: <Briefcase size={18} />,
        label: "Kelola Divisi",
        page: "divisi",
      },
      {
        icon: <BarChart3 size={18} />,
        label: "Presensi & Kegiatan",
        page: "presensi",
      },
      {
        icon: <Star size={18} />,
        label: "Rekomendasi Kelulusan",
        page: "rekomendasi",
      },
      {
        icon: <Award size={18} />,
        label: "Kelola Sertifikat",
        page: "sertifikat",
      },
      {
        icon: <FileText size={18} />,
        label: "Laporan & Rekap",
        page: "laporan",
      },
    ];
  }
  // calon / peserta
  const base: NavItem[] = [
    { icon: <Home size={18} />, label: "Dashboard", page: "dashboard" },
    { icon: <UserCircle size={18} />, label: "Profil", page: "profil" },
    {
      icon: <ClipboardList size={18} />,
      label: "Pendaftaran",
      page: "pendaftaran",
    },
  ];
  if (role === "peserta") {
    return [
      ...base,
      {
        icon: <BookOpen size={18} />,
        label: "Laporan",
        page: "laporan-peserta",
      },
      {
        icon: <Award size={18} />,
        label: "Sertifikat",
        page: "sertifikat-peserta",
      },
    ];
  }
  return base;
}

function Sidebar({
  role,
  page,
  setPage,
  open,
  setOpen,
  onLogout,
  resetSelection,
}: {
  role: Role;
  page: Page;
  setPage: (p: Page) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  onLogout: () => void;
  resetSelection: () => void;
}) {
  const items = getNavItems(role);
  const roleLabel: Record<Role, string> = {
    admin: "Administrator",
    calon: "Calon Magang",
    peserta: "Peserta Magang",
  };

  return (
    <aside
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={cn(
        "fixed top-0 left-0 h-full z-30 flex flex-col overflow-hidden transition-[width] duration-300",
        "bg-[#1B4332] text-white",
        open ? "w-64" : "w-20",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-5 py-5 border-b border-white/10",
          !open && "justify-center px-0",
        )}
      >
        <div className="w-9 h-9 flex items-center justify-center shrink-0">
          <img
            src={logoKabupatenMadiun}
            alt="Logo Kabupaten Madiun"
            className="w-full h-full object-contain"
          />
        </div>
        {open && (
          <div className="whitespace-nowrap">
            <p className="font-bold text-base leading-tight">SIMAGO</p>
            <p className="text-[10px] text-[#A8C3AD] leading-tight">
              Sistem Magang Go
            </p>
            <p className="text-[10px] text-[#A8C3AD] leading-tight">
              Dukcapil Kabupaten Madiun
            </p>
          </div>
        )}
      </div>

      {/* Role badge */}
      {open && (
        <div className="px-4 py-3">
          <div className="bg-[#2D5A45] rounded-lg px-3 py-2 whitespace-nowrap">
            <p className="text-[10px] text-[#A8C3AD] uppercase tracking-wider font-semibold">
              Role
            </p>
            <p className="text-sm font-semibold text-white">
              {roleLabel[role]}
            </p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 space-y-0.5">
        {items.map((item) => (
          <button
            key={item.page}
            title={!open ? item.label : undefined}
            onClick={() => {
              resetSelection();
              setPage(item.page);
              setOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
              !open && "justify-center px-0",
              page === item.page ||
                (item.page === "presensi" &&
                  ["monitoring", "absensi-riwayat", "review-laporan"].includes(
                    page,
                  ))
                ? "bg-white/15 text-white"
                : "text-white/65 hover:bg-white/8 hover:text-white",
            )}
          >
            {item.icon}
            {open && item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={onLogout}
          title={!open ? "Keluar" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/65 hover:bg-white/8 hover:text-white transition-colors whitespace-nowrap",
            !open && "justify-center px-0",
          )}
        >
          <LogOut size={18} /> {open && "Keluar"}
        </button>
      </div>
    </aside>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

function NotificationBell({
  onNavigate,
}: {
  onNavigate: (page: Page, pendaftaranId?: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifikasiItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifikasi");
      setItems(data.data);
      setUnreadCount(data.unread_count);
    } catch {
      // gagal diam-diam — notifikasi bukan fitur kritis, jangan ganggu halaman lain
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000); // polling ringan setiap 1 menit
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markRead(id: number) {
    setItems((list) =>
      list.map((n) => (n.id === id ? { ...n, dibaca: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await api.put(`/notifikasi/${id}/baca`);
    } catch {
      load(); // kalau gagal, sinkronkan ulang dari server
    }
  }

  async function markAllRead() {
    setItems((list) => list.map((n) => ({ ...n, dibaca: true })));
    setUnreadCount(0);
    try {
      await api.put("/notifikasi/baca-semua");
    } catch {
      load();
    }
  }

  async function deleteNotif(e: React.MouseEvent, n: NotifikasiItem) {
    e.stopPropagation(); // jangan ikut memicu klik/navigasi kartu notifikasi
    setDeletingId(n.id);
    setItems((list) => list.filter((x) => x.id !== n.id));
    if (!n.dibaca) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await api.delete(`/notifikasi/${n.id}`);
    } catch {
      load(); // gagal hapus di server → sinkronkan ulang supaya tidak "hilang" palsu
    } finally {
      setDeletingId(null);
    }
  }

  function handleClickItem(n: NotifikasiItem) {
    if (!n.dibaca) markRead(n.id);
    if (n.halaman) {
      onNavigate(n.halaman as Page, n.pendaftaran_id);
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative text-[#6B7770] hover:text-[#1B4332] transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[#1B4332] rounded-full text-[9px] text-white flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-lg border border-[#1B4332]/10 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1B4332]/10">
            <p className="font-bold text-[#1B4332] text-sm">Notifikasi</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-[#1B4332] hover:underline flex items-center gap-1"
              >
                <CheckCircle size={12} /> Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="py-8">
                <LoadingState label="Memuat notifikasi..." />
              </div>
            ) : items.length === 0 ? (
              <div className="py-8">
                <EmptyState label="Belum ada notifikasi." />
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClickItem(n)}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-[#1B4332]/5 hover:bg-[#F1F3F1] transition-colors flex gap-2.5 cursor-pointer group",
                    !n.dibaca && "bg-[#D1FAE5]/30",
                  )}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                      !n.dibaca ? "bg-[#1B4332]" : "bg-transparent",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm leading-tight",
                        !n.dibaca
                          ? "font-bold text-[#1B4332]"
                          : "font-semibold text-[#3D4442]",
                      )}
                    >
                      {n.judul}
                    </p>
                    <p className="text-xs text-[#6B7770] mt-0.5 leading-snug">
                      {n.pesan}
                    </p>
                    <p className="text-[11px] text-[#6B7770]/70 mt-1">
                      {n.waktu}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteNotif(e, n)}
                    disabled={deletingId === n.id}
                    title="Hapus notifikasi"
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[#6B7770]/50 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TopBar({
  role,
  userName,
  setPage,
  onNotifNavigate,
}: {
  role: Role;
  userName: string;
  setPage: (p: Page) => void;
  onNotifNavigate: (page: Page, pendaftaranId?: number | null) => void;
}) {
  return (
    <header className="h-14 shrink-0 bg-white border-b border-[#1B4332]/10 flex items-center px-4 gap-4">
      <div className="flex-1" />
      <NotificationBell onNavigate={onNotifNavigate} />
      <div
        onClick={() => setPage("profil" as Page)}
        className="flex items-center gap-2 pl-3 border-l border-[#1B4332]/10 cursor-pointer hover:opacity-75 transition-opacity"
      >
        <div className="w-8 h-8 rounded-full bg-[#1B4332] flex items-center justify-center text-white text-xs font-bold">
          {userName.charAt(0)}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-[#3D4442] leading-tight">
            {userName}
          </p>
          <p className="text-[11px] text-[#6B7770] leading-tight capitalize">
            {role}
          </p>
        </div>
        <ChevronDown size={14} className="text-[#6B7770]" />
      </div>
    </header>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function Layout({
  role,
  page,
  setPage,
  onLogout,
  userName,
  onNotifNavigate,
  resetSelection,
  children,
}: {
  role: Role;
  page: Page;
  setPage: (p: Page) => void;
  onLogout: () => void;
  userName: string;
  onNotifNavigate: (page: Page, pendaftaranId?: number | null) => void;
  resetSelection: () => void;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="h-screen overflow-hidden bg-[#FAFAF8] font-[Plus_Jakarta_Sans]">
      <Sidebar
        role={role}
        page={page}
        setPage={setPage}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        onLogout={onLogout}
        resetSelection={resetSelection}
      />
      <div className="ml-20 flex flex-col h-screen">
        <TopBar
          role={role}
          userName={userName}
          setPage={setPage}
          onNotifNavigate={onNotifNavigate}
        />
        <main className="flex-1 min-h-0 p-5 lg:p-6 overflow-y-auto">
          {children}
        </main>
        <footer className="shrink-0 bg-white border-t border-[#1B4332]/10 py-3 lg:py-4 overflow-hidden">
          <div className="flex w-max animate-marquee">
            {[0, 1].map((i) => (
              <p
                key={i}
                aria-hidden={i === 1 ? true : undefined}
                className="text-xs text-[#6B7770] whitespace-nowrap px-6"
              >
                Copyright © 2026{" "}
                <a
                  href="#"
                  className="text-[#1B4332] font-medium hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Aura Nabila
                </a>{" "}
                &{" "}
                <a
                  href="#"
                  className="text-[#1B4332] font-medium hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Aulia Restu Mahardika
                </a>{" "}
                <span className="text-[#A8C3AD]">|</span>{" "}
                <a
                  href="/"
                  className="text-[#1B4332] font-medium hover:underline"
                >
                  simago
                </a>
                . All rights reserved.
                <span className="mx-2 text-[#A8C3AD]">|</span>
                Persembahan untuk Dinas Kependudukan dan Pencatatan Sipil
                Kabupaten Madiun dari Mahasiswa Magang Teknik Informatika
                Universitas PGRI Madiun
              </p>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

const DEMO_ACCOUNTS = {
  admin: {
    email: "admin@simago.id",
    password: "admin123",
    name: "Admin SIMAGO",
  },
  calon: {
    email: "aura@gmail.com",
    password: "123456",
    name: "aura",
  },
  peserta: {
    email: "aulia@gmail.com",
    password: "123456",
    name: "Aulia Restu Mahardika",
  },
};

const ROLE_TABS: { key: Role; label: string }[] = [
  { key: "admin", label: "Admin" },
  { key: "calon", label: "Calon Magang" },
  { key: "peserta", label: "Peserta Magang" },
];

function LoginPage({
  onLogin,
}: {
  onLogin: (role: Role, name: string, token: string) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [tab, setTab] = useState<Role>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [regNama, setRegNama] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const demo = DEMO_ACCOUNTS[tab];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/login", { email, password });
      onLogin(
        data.user.role as Role,
        data.user.nama as string,
        data.token as string,
      );
    } catch (err) {
      setError(apiErrorMessage(err, "Email atau kata sandi salah."));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    if (regPassword !== regPasswordConfirm) {
      setRegError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setRegLoading(true);
    try {
      const { data } = await api.post("/register", {
        nama: regNama,
        email: regEmail,
        password: regPassword,
        password_confirmation: regPasswordConfirm,
      });
      onLogin(
        data.user.role as Role,
        data.user.nama as string,
        data.token as string,
      );
    } catch (err) {
      setRegError(apiErrorMessage(err, "Gagal mendaftar. Coba lagi."));
    } finally {
      setRegLoading(false);
    }
  }

  function switchToRegister() {
    setMode("register");
    setError("");
  }

  function switchToLogin() {
    setMode("login");
    setRegError("");
  }

  function fillDemo() {
    setEmail(demo.email);
    setPassword(demo.password);
    setError("");
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 font-[Plus_Jakarta_Sans]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <img
              src={logoKabupatenMadiun}
              alt="Logo Kabupaten Madiun"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-[#1B4332]">SIMAGO</h1>
          <p className="text-sm text-[#6B7770] mt-1">Sistem Magang Go</p>
          <p className="text-xs text-[#6B7770] mt-0.5">
            Dinas Kependudukan dan Pencatatan Sipil Kab. Madiun
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#1B4332]/10 overflow-hidden">
          {mode === "login" ? (
            <>
              {/* Role tabs */}
              <div className="grid grid-cols-4 border-b border-[#1B4332]/10">
                {ROLE_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => {
                      setTab(t.key);
                      setError("");
                    }}
                    className={cn(
                      "py-3 text-[11px] font-semibold transition-colors border-b-2",
                      tab === t.key
                        ? "border-[#1B4332] text-[#1B4332] bg-[#F1F3F1]"
                        : "border-transparent text-[#6B7770] hover:text-[#3D4442]",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="Masukkan email"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-[#3D4442] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]/40 transition"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-[#3D4442]">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      className="text-xs text-[#1B4332] hover:underline font-medium"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Masukkan kata sandi"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-[#3D4442] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]/40 transition"
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle size={15} /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#1B4332] hover:bg-[#2D5A45] disabled:opacity-60 text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? "Memproses..." : "Masuk"}
                </button>

                {/* Demo credentials */}
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wide mb-2">
                    Kredensial Demo —{" "}
                    {ROLE_TABS.find((t) => t.key === tab)?.label}
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-amber-900">
                      <span className="font-medium">Email:</span>
                      <code className="font-mono">{demo.email}</code>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-amber-900">
                      <span className="font-medium">Password:</span>
                      <code className="font-mono">{demo.password}</code>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fillDemo}
                    className="mt-2 text-[11px] font-semibold text-amber-800 hover:underline"
                  >
                    Isi otomatis →
                  </button>
                </div>
              </form>

              <div className="px-6 pb-5 text-center">
                <p className="text-sm text-[#6B7770]">
                  Belum punya akun?{" "}
                  <button
                    type="button"
                    onClick={switchToRegister}
                    className="text-[#1B4332] font-semibold hover:underline"
                  >
                    Daftar sekarang
                  </button>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="px-6 pt-6 pb-1">
                <p className="text-[11px] font-bold text-[#1B4332] uppercase tracking-wide">
                  Daftar sebagai Calon Magang
                </p>
                <p className="text-xs text-[#6B7770] mt-1">
                  Akun Admin dibuat oleh administrator, bukan lewat pendaftaran
                  mandiri.
                </p>
              </div>

              <form
                onSubmit={handleRegisterSubmit}
                className="p-6 pt-4 space-y-4"
              >
                <div>
                  <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={regNama}
                    onChange={(e) => {
                      setRegNama(e.target.value);
                      setRegError("");
                    }}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-[#3D4442] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]/40 transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      setRegError("");
                    }}
                    placeholder="Masukkan email"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-[#3D4442] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]/40 transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                    Kata Sandi
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      setRegError("");
                    }}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-[#3D4442] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]/40 transition"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                    Konfirmasi Kata Sandi
                  </label>
                  <input
                    type="password"
                    value={regPasswordConfirm}
                    onChange={(e) => {
                      setRegPasswordConfirm(e.target.value);
                      setRegError("");
                    }}
                    placeholder="Ulangi kata sandi"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-[#3D4442] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332]/40 transition"
                    required
                    minLength={6}
                  />
                </div>

                {regError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle size={15} /> {regError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3 bg-[#1B4332] hover:bg-[#2D5A45] disabled:opacity-60 text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {regLoading && <Loader2 size={15} className="animate-spin" />}
                  {regLoading ? "Mendaftarkan..." : "Daftar Sekarang"}
                </button>
              </form>

              <div className="px-6 pb-5 text-center">
                <p className="text-sm text-[#6B7770]">
                  Sudah punya akun?{" "}
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="text-[#1B4332] font-semibold hover:underline"
                  >
                    Masuk
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Admin Pages ──────────────────────────────────────────────────────────────

// ─── Modal overlay generik (dipakai untuk panel Pengumuman di Dashboard Admin) ─
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-lg border border-[#1B4332]/10 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1B4332]/10 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-bold text-[#1B4332]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B7770] hover:bg-[#F1F3F1] hover:text-[#1B4332] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function AdminDashboard({ setPage }: { setPage: (page: AdminPage) => void }) {
  const [periodOpen, setPeriodOpen] = useState(true);
  const [togglingPeriod, setTogglingPeriod] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [divisi, setDivisi] = useState<Divisi[]>([]);
  const [recent, setRecent] = useState<PendaftarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dash, div, rec, periode] = await Promise.all([
        api.get("/dashboard"),
        api.get("/divisi"),
        api.get("/pendaftar", { params: { per_page: 5 } }),
        api.get("/pengaturan/periode"),
      ]);
      setStats(dash.data);
      setDivisi(div.data.data);
      setRecent(rec.data.data);
      setPeriodOpen(periode.data.dibuka);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState label="Memuat dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const trendData = (stats?.trend_pendaftar ?? []).map((t: any) => ({
    bulan: t.bulan,
    pendaftar: t.pendaftar,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1B4332]">Dashboard Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage("pengumuman")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#1B4332] text-white hover:bg-[#2D5A45] transition-colors"
          >
            <Megaphone size={16} />
            Pengumuman
          </button>
          <button
            disabled={togglingPeriod}
            onClick={async () => {
              const next = !periodOpen;
              setTogglingPeriod(true);
              try {
                await api.put("/pengaturan/periode", { dibuka: next });
                setPeriodOpen(next);
              } catch (err) {
                alert(apiErrorMessage(err, "Gagal mengubah status periode."));
              } finally {
                setTogglingPeriod(false);
              }
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60",
              periodOpen
                ? "bg-[#1B4332] text-white hover:bg-[#2D5A45]"
                : "bg-red-600 text-white hover:bg-red-700",
            )}
          >
            {periodOpen ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            Periode {periodOpen ? "Buka" : "Tutup"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          icon={<Users size={18} className="text-[#1B4332]" />}
          label="Total Pendaftar"
          value={stats?.jumlah_pendaftar ?? 0}
          color="bg-[#D1FAE5]"
        />
        <SummaryCard
          icon={<Clock size={18} className="text-amber-700" />}
          label="Menunggu Verifikasi"
          value={stats?.menunggu_verifikasi ?? 0}
          color="bg-amber-100"
        />
        <SummaryCard
          icon={<CheckCircle size={18} className="text-[#1B4332]" />}
          label="Peserta Aktif"
          value={stats?.jumlah_peserta ?? 0}
          color="bg-[#D1FAE5]"
        />
        <SummaryCard
          icon={<BookOpen size={18} className="text-[#2D5A45]" />}
          label="Laporan Perlu Review"
          value={stats?.laporan_perlu_review ?? 0}
          color="bg-[#D1FAE5]"
        />
        <SummaryCard
          icon={<Award size={18} className="text-amber-700" />}
          label="Rata-rata Kehadiran"
          value={`${stats?.persentase_kehadiran ?? 0}%`}
          color="bg-amber-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <h3 className="font-bold text-[#1B4332] mb-4">
            Tren Pendaftaran Per Bulan
          </h3>
          {trendData.length === 0 ? (
            <EmptyState label="Belum ada data pendaftaran." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={trendData}
                margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5EDE8" />
                <XAxis
                  dataKey="bulan"
                  tick={{ fontSize: 11, fill: "#6B7770" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "#6B7770" }} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #E5EDE8",
                  }}
                />
                <Bar dataKey="pendaftar" fill="#1B4332" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="font-bold text-[#1B4332] mb-4">Distribusi Divisi</h3>
          <div className="space-y-3">
            {divisi.map((d) => {
              const terisi = d.kuota - d.sisa_kuota;
              return (
                <div key={d.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-[#3D4442]">{d.nama}</span>
                    <span className="text-[#6B7770]">
                      {terisi}/{d.kuota}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F1F3F1]">
                    <div
                      className="h-2 rounded-full bg-[#1B4332] transition-all"
                      style={{
                        width: `${d.kuota ? (terisi / d.kuota) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold text-[#1B4332] mb-4">5 Pendaftar Terbaru</h3>
        {recent.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1B4332]/10">
                  {[
                    "Nama",
                    "Institusi",
                    "Divisi",
                    "Tanggal Daftar",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2 px-3 text-[#6B7770] text-xs font-semibold uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#1B4332]/5 hover:bg-[#F1F3F1]/50 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium text-[#3D4442]">
                      {p.nama}
                    </td>
                    <td className="py-2.5 px-3 text-[#6B7770]">
                      {p.institusi}
                    </td>
                    <td className="py-2.5 px-3 text-[#6B7770]">{p.divisi}</td>
                    <td className="py-2.5 px-3 text-[#6B7770]">{p.tanggal}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * Data Pendaftar — halaman tunggal yang menggabungkan tiga fungsi lama:
 * Data Pendaftar, Verifikasi Berkas, dan Penempatan Peserta.
 *
 * - Kolom "Informasi": modal berisi data diri & detail magang pendaftar.
 * - Kolom "Verifikasi Berkas": progres dokumen + modal untuk memverifikasi
 *   tiap dokumen dan mengirim keputusan seleksi (fungsi sama seperti menu
 *   Verifikasi Berkas sebelumnya, dipindah ke sini).
 * - Kolom "Penempatan": begitu status disetujui, backend OTOMATIS membuat
 *   Peserta Magang mengikuti divisi yang dipilih saat mendaftar — tidak ada
 *   lagi tombol "Tempatkan". Dropdown ini hanya untuk mengubah divisi
 *   peserta yang sudah aktif, tersimpan langsung ke database.
 */
function AdminPendaftar({
  selectedPendaftaranId,
  onSelectPendaftaran,
  setPage,
}: {
  selectedPendaftaranId: number | null;
  onSelectPendaftaran: (id: number | null) => void;
  setPage: (p: Page) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filtered, setFiltered] = useState<PendaftarItem[]>([]);
  const [divisions, setDivisions] = useState<Divisi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingDivisiId, setSavingDivisiId] = useState<number | null>(null);

  // ── Modal "Informasi" ───────────────────────────────────────────────────
  const [infoId, setInfoId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pd, div] = await Promise.all([
        api.get("/pendaftar", {
          params: { search, status: filterStatus, per_page: 50 },
        }),
        api.get("/divisi"),
      ]);
      setFiltered(pd.data.data);
      setDivisions(div.data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data pendaftar."));
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce pencarian
    return () => clearTimeout(t);
  }, [load]);

  function bukaVerifikasi(id: number) {
    onSelectPendaftaran(id);
    setPage("verifikasi");
  }

  async function assignDivisi(pesertaMagangId: number, divisiId: number) {
    setSavingDivisiId(pesertaMagangId);
    try {
      await api.put(`/peserta/${pesertaMagangId}`, { divisi_id: divisiId });
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal menyimpan penempatan."));
    } finally {
      setSavingDivisiId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-[#1B4332]">
          Manajemen Data Pendaftar
        </h1>
      </div>

      {divisions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {divisions.map((d) => {
            const terisi = d.kuota - d.sisa_kuota;
            const pct = d.kuota ? Math.round((terisi / d.kuota) * 100) : 0;
            const full = terisi >= d.kuota;
            return (
              <Card
                key={d.id}
                className={cn("text-center", full && "border-red-300")}
              >
                <p className="font-bold text-[#1B4332] text-sm">{d.nama}</p>
                <p
                  className="text-2xl font-bold mt-1"
                  style={{ color: full ? "#B91C1C" : "#1B4332" }}
                >
                  {terisi}
                </p>
                <p className="text-xs text-[#6B7770]">dari {d.kuota} kuota</p>
                <div className="h-1.5 rounded-full bg-[#F1F3F1] mt-2">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: full ? "#B91C1C" : "#1B4332",
                    }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7770]"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama pendaftar..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none"
          >
            <option value="semua">Semua Status</option>
            <option value="belum_ada_data">Belum Ada Data</option>
            <option value="menunggu">Menunggu</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState label="Tidak ada pendaftar yang cocok." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1B4332]/10">
                  {[
                    "No",
                    "Nama",
                    "Informasi",
                    "Status",
                    "Batas Pengumuman",
                    "Verifikasi Berkas",
                    "Penempatan",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2.5 px-3 text-[#6B7770] text-xs font-semibold uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const docs = p.dokumen ?? [];
                  const verified = docs.filter(
                    (d) => d.status === "terverifikasi",
                  ).length;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-[#1B4332]/5 hover:bg-[#F1F3F1]/50 transition-colors"
                    >
                      <td className="py-3 px-3 text-[#6B7770]">{p.id}</td>
                      <td className="py-3 px-3 font-semibold text-[#1B4332]">
                        {p.nama}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setInfoId(p.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F1F3F1] text-[#1B4332] text-xs font-semibold hover:bg-[#D1FAE5] transition-colors"
                        >
                          <Eye size={13} /> Lihat
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge
                          status={
                            p.status === "menunggu" && !p.dokumen_dikirim
                              ? "belum_ada_data"
                              : p.status
                          }
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div
                          className={cn(
                            p.status === "menunggu" &&
                              p.sisa_hari_pengumuman !== null &&
                              p.sisa_hari_pengumuman <= 3
                              ? "text-red-600"
                              : "text-[#6B7770]",
                          )}
                        >
                          <p className="text-xs font-medium">
                            {p.batas_pengumuman}
                          </p>
                          {p.status === "menunggu" &&
                            p.sisa_hari_pengumuman !== null && (
                              <p className="text-[11px] mt-0.5 opacity-80">
                                {p.sisa_hari_pengumuman === 0
                                  ? "Hari ini terakhir"
                                  : `Sisa ${p.sisa_hari_pengumuman} hari`}
                              </p>
                            )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#6B7770] whitespace-nowrap">
                            {verified}/{docs.length}
                          </span>
                          <button
                            onClick={() => bukaVerifikasi(p.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D1FAE5] text-[#1B4332] text-xs font-semibold hover:bg-[#A8C3AD] transition-colors whitespace-nowrap"
                          >
                            <ClipboardList size={13} /> Verifikasi
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {p.peserta_magang_id ? (
                          <select
                            value={p.peserta_magang_divisi_id ?? p.divisi_id}
                            disabled={savingDivisiId === p.peserta_magang_id}
                            onChange={(e) =>
                              assignDivisi(
                                p.peserta_magang_id!,
                                Number(e.target.value),
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-[#1B4332]/15 bg-white text-xs text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                          >
                            {divisions.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.nama}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-[#6B7770]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {infoId && (
        <InformasiPendaftarModal
          pendaftaranId={infoId}
          onClose={() => setInfoId(null)}
        />
      )}
    </div>
  );
}

function InformasiPendaftarModal({
  pendaftaranId,
  onClose,
}: {
  pendaftaranId: number;
  onClose: () => void;
}) {
  const [p, setP] = useState<PendaftarItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/pendaftar/${pendaftaranId}`);
      setP(data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data pendaftar."));
    } finally {
      setLoading(false);
    }
  }, [pendaftaranId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Modal title="Informasi Pendaftar" onClose={onClose}>
      {loading ? (
        <LoadingState />
      ) : error || !p ? (
        <ErrorState message={error || "Data tidak ditemukan."} onRetry={load} />
      ) : (
        <div className="space-y-5">
          <div>
            <h3 className="font-bold text-[#1B4332] mb-2">Data Diri</h3>
            <div className="space-y-1.5 text-sm">
              {(
                [
                  ["Nama", p.nama],
                  ["NIM", p.nim],
                  ["Tgl Lahir", p.tanggal_lahir ?? "-"],
                  ["No. HP", p.no_hp],
                  ["Institusi", p.institusi],
                  ["Jurusan", p.jurusan],
                  ["Semester", p.semester],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-[#6B7770]">{k}</span>
                  <span className="font-medium text-[#3D4442] text-right">
                    {v || "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-[#1B4332] mb-2">Detail Magang</h3>
            <div className="space-y-1.5 text-sm">
              {(
                [
                  ["Mulai", p.tanggal_mulai],
                  ["Selesai", p.tanggal_selesai],
                  ["Divisi", p.divisi],
                  ["Motivasi", p.motivasi || "-"],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-[#6B7770]">{k}</span>
                  <span className="font-medium text-[#3D4442] text-right">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function VerifikasiBerkasPage({
  pendaftaranId,
  onBack,
}: {
  pendaftaranId: number | null;
  onBack: () => void;
}) {
  const [p, setP] = useState<PendaftarItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyDoc, setBusyDoc] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!pendaftaranId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/pendaftar/${pendaftaranId}`);
      setP(data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data pendaftar."));
    } finally {
      setLoading(false);
    }
  }, [pendaftaranId]);

  useEffect(() => {
    load();
  }, [load]);

  async function review(dokId: number, status: "terverifikasi" | "ditolak") {
    setBusyDoc(dokId);
    try {
      const catatan =
        status === "ditolak"
          ? (prompt("Catatan penolakan dokumen:") ??
            "Dokumen tidak sesuai, harap upload ulang.")
          : undefined;
      await api.put(`/verifikasi/${dokId}`, { status, catatan });
      await load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal memperbarui status dokumen."));
    } finally {
      setBusyDoc(null);
    }
  }

  // ── Keputusan seleksi ──────────────────────────────────────────────────
  const [decision, setDecision] = useState<"" | "disetujui" | "ditolak">("");
  const [editingKeputusan, setEditingKeputusan] = useState(false);
  const [sendingKeputusan, setSendingKeputusan] = useState(false);

  useEffect(() => {
    if (!p) return;
    const sudahDiputuskan = p.status === "disetujui" || p.status === "ditolak";
    setDecision(sudahDiputuskan ? (p.status as "disetujui" | "ditolak") : "");
    setEditingKeputusan(!sudahDiputuskan);
  }, [p]);

  async function kirimKeputusan() {
    if (!pendaftaranId || !decision) return;
    setSendingKeputusan(true);
    try {
      await api.put(`/pendaftar/${pendaftaranId}`, { status: decision });
      await load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal mengirim keputusan."));
    } finally {
      setSendingKeputusan(false);
    }
  }

  if (!pendaftaranId) {
    return (
      <div className="space-y-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7770] hover:text-[#1B4332] transition-colors"
        >
          <ArrowLeft size={15} /> Kembali ke Daftar Pendaftar
        </button>
        <Card>
          <EmptyState label='Pilih pendaftar dari halaman "Data Pendaftar" (tombol "Verifikasi") untuk memverifikasi berkasnya.' />
        </Card>
      </div>
    );
  }

  if (loading) return <LoadingState />;
  if (error || !p) {
    return (
      <ErrorState message={error || "Data tidak ditemukan."} onRetry={load} />
    );
  }

  const docs = p.dokumen ?? [];
  const verified = docs.filter((d) => d.status === "terverifikasi").length;
  const pct = docs.length ? Math.round((verified / docs.length) * 100) : 0;
  const semuaTerverifikasi = docs.length > 0 && verified === docs.length;
  const sudahDiputuskan = p.status === "disetujui" || p.status === "ditolak";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <h1 className="text-xl font-bold text-[#1B4332]">
          Verifikasi Berkas — {p.nama}
        </h1>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7770] hover:text-[#1B4332] transition-colors"
        >
          <ArrowLeft size={15} /> Kembali ke Daftar Pendaftar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#1B4332] flex items-center justify-center text-white font-bold text-lg">
              {p.nama.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-[#1B4332]">{p.nama}</p>
              <p className="text-sm text-[#6B7770]">
                {p.institusi} — {p.jurusan}
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {[
              ["Divisi", p.divisi],
              ["Periode", p.periode],
              ["Tgl Daftar", p.tanggal],
              ["Status", p.status],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-[#6B7770]">{k}</span>
                <span className="font-medium text-[#3D4442]">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[#1B4332]/10">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-[#3D4442]">
                Kelengkapan Berkas
              </span>
              <span className="font-bold text-[#1B4332]">{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-[#F1F3F1]">
              <div
                className="h-2.5 rounded-full bg-[#1B4332] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-[#6B7770] mt-1">
              {verified} dari {docs.length} dokumen terverifikasi
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-[#1B4332]/10">
            <h3 className="font-bold text-[#1B4332] mb-1">Keputusan Seleksi</h3>
            <p className="text-xs text-[#6B7770] mb-4">
              Setelah seluruh dokumen terverifikasi, tentukan hasil seleksi.
              Jika disetujui, calon otomatis menjadi peserta magang di divisi
              yang dipilihnya saat mendaftar.
            </p>

            {sudahDiputuskan && !editingKeputusan && (
              <div className="flex items-center gap-3 flex-wrap p-3 rounded-xl bg-[#F1F3F1] border border-[#1B4332]/8">
                <StatusBadge status={p.status} />
                <div className="flex-1" />
                <button
                  onClick={() => setEditingKeputusan(true)}
                  className="text-xs font-semibold text-[#6B7770] hover:text-[#1B4332] underline"
                >
                  Ubah keputusan
                </button>
              </div>
            )}

            {(editingKeputusan || !sudahDiputuskan) && (
              <div className="space-y-3">
                {!semuaTerverifikasi && (
                  <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                    Verifikasi seluruh dokumen di atas terlebih dahulu sebelum
                    mengambil keputusan seleksi.
                  </p>
                )}
                <select
                  value={decision}
                  onChange={(e) =>
                    setDecision(e.target.value as "" | "disetujui" | "ditolak")
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none"
                >
                  <option value="">Pilih keputusan...</option>
                  <option value="disetujui">Diterima</option>
                  <option value="ditolak">Ditolak</option>
                </select>
                <div className="flex items-center gap-2">
                  <button
                    disabled={
                      !semuaTerverifikasi || !decision || sendingKeputusan
                    }
                    onClick={kirimKeputusan}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-40"
                  >
                    <Send size={15} />
                    {sendingKeputusan ? "Mengirim..." : "Kirim Keputusan"}
                  </button>
                  {sudahDiputuskan && (
                    <button
                      onClick={() => setEditingKeputusan(false)}
                      className="text-xs font-semibold text-[#6B7770] hover:text-[#1B4332]"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="font-bold text-[#1B4332] mb-4">Daftar Dokumen</h3>
          {docs.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#F1F3F1] border border-[#1B4332]/8"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#3D4442] text-sm">
                      {doc.nama}
                    </p>
                    {doc.status === "ditolak" && doc.catatan && (
                      <p className="text-xs text-red-600 mt-0.5">
                        {doc.catatan}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={doc.status} />
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {doc.file_url && (
                      <button
                        onClick={() => openAuthenticatedFile(doc.file_url!)}
                        className="p-1.5 rounded-lg hover:bg-[#D1FAE5] text-[#1B4332] transition-colors"
                        title="Lihat file"
                      >
                        <Eye size={13} />
                      </button>
                    )}
                    {doc.status === "menunggu" && (
                      <>
                        <button
                          disabled={busyDoc === doc.id}
                          onClick={() => review(doc.id, "terverifikasi")}
                          className="p-1.5 rounded-lg bg-[#D1FAE5] text-[#1B4332] hover:bg-[#A8C3AD] transition-colors disabled:opacity-40"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          disabled={busyDoc === doc.id}
                          onClick={() => review(doc.id, "ditolak")}
                          className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-40"
                        >
                          <XCircle size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function AdminDivisi() {
  const [list, setList] = useState<Divisi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Divisi | null>(null);
  const [form, setForm] = useState({ nama: "", kuota: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/divisi");
      setList(res.data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data divisi."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ nama: "", kuota: "" });
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(d: Divisi) {
    setEditing(d);
    setForm({ nama: d.nama, kuota: d.kuota.toString() });
    setFormError("");
    setFormOpen(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = { nama: form.nama, kuota: Number(form.kuota) };
      if (editing) {
        await api.put(`/divisi/${editing.id}`, payload);
      } else {
        await api.post("/divisi", payload);
      }
      setFormOpen(false);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, "Gagal menyimpan data divisi."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(d: Divisi) {
    if (!confirm(`Hapus divisi ${d.nama}?`)) return;
    try {
      await api.delete(`/divisi/${d.id}`);
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal menghapus divisi."));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-[#1B4332]">Kelola Divisi</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors"
        >
          <Plus size={15} /> Tambah Divisi
        </button>
      </div>

      {formOpen && (
        <Card>
          <h3 className="font-bold text-[#1B4332] mb-3">
            {editing ? "Edit Divisi" : "Tambah Divisi"}
          </h3>
          <form
            onSubmit={submitForm}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <input
              required
              value={form.nama}
              onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
              placeholder="Nama Divisi"
              className="px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
            />
            <input
              required
              type="number"
              min={0}
              value={form.kuota}
              onChange={(e) =>
                setForm((f) => ({ ...f, kuota: e.target.value }))
              }
              placeholder="Kuota Peserta"
              className="px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
            />
            {formError && (
              <p className="sm:col-span-2 text-sm text-red-600">{formError}</p>
            )}
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 border border-[#1B4332]/20 text-[#1B4332] text-sm font-semibold rounded-lg hover:bg-[#D1FAE5] transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : list.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1B4332]/10">
                  {["Nama Divisi", "Kuota", "Sisa Kuota", "Aksi"].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2.5 px-3 text-[#6B7770] text-xs font-semibold uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-[#1B4332]/5 hover:bg-[#F1F3F1]/50 transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-[#1B4332]">
                      {d.nama}
                    </td>
                    <td className="py-3 px-3 text-[#6B7770]">{d.kuota}</td>
                    <td className="py-3 px-3 font-bold text-[#1B4332]">
                      {d.sisa_kuota}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(d)}
                          className="p-1.5 rounded-lg hover:bg-[#D1FAE5] text-[#1B4332] transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function AdminProfil() {
  const [profil, setProfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [nama, setNama] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/profil");
      setProfil(data);
      setNama(data.nama ?? "");
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat profil."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProfil() {
    setSaving(true);
    setSaveError("");
    try {
      const payload: Record<string, string> = { nama };
      if (password) payload.password = password;
      await api.put("/profil", payload);
      setEditing(false);
      setPassword("");
      load();
    } catch (err) {
      setSaveError(apiErrorMessage(err, "Gagal menyimpan profil."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!profil) return null;

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-[#1B4332]">Profil Saya</h1>
      <Card>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-[#1B4332] flex items-center justify-center text-white text-2xl font-bold">
            {profil.nama.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-[#1B4332] text-lg">{profil.nama}</p>
            <p className="text-sm text-[#6B7770]">{profil.email}</p>
          </div>
          <button
            onClick={() => setEditing((e) => !e)}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 border border-[#1B4332]/20 text-[#1B4332] text-sm font-semibold rounded-lg hover:bg-[#D1FAE5] transition-colors"
          >
            <Edit2 size={13} /> {editing ? "Batal" : "Edit"}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                Nama
              </label>
              <input
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                Password Baru (kosongkan jika tidak diubah)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
              />
            </div>
            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            <button
              disabled={saving}
              onClick={saveProfil}
              className="px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["Nama", profil.nama],
                ["Email", profil.email],
                ["Role", "Administrator"],
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k} className="p-3 rounded-xl bg-[#F1F3F1]">
                <p className="text-[10px] font-semibold text-[#6B7770] uppercase tracking-wide">
                  {k}
                </p>
                <p className="text-sm font-semibold text-[#3D4442] mt-0.5">
                  {v}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Rekap Absensi Peserta (dari tombol "Rekap" di Monitoring Kehadiran) ───
// State navigasinya LOKAL di dalam AdminMonitoring (bukan mekanisme
// selectedPesertaId/setPage global), supaya tombol "Kembali" mengarah balik
// ke tab Monitoring Kehadiran — bukan ke Dashboard.
function RekapAbsensiPeserta({
  pesertaMagangId,
  onBack,
}: {
  pesertaMagangId: number;
  onBack: () => void;
}) {
  const [data, setData] = useState<RekapAbsensiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/peserta/${pesertaMagangId}/rekap-absensi`);
      setData(res.data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat rekap absensi."));
    } finally {
      setLoading(false);
    }
  }, [pesertaMagangId]);

  useEffect(() => {
    load();
  }, [load]);

  function kejadianBadge(status: string) {
    const cls =
      status === "Izin"
        ? "bg-amber-100 text-amber-800"
        : status === "Sakit"
          ? "bg-red-100 text-red-700"
          : status === "Lupa Absen"
            ? "bg-orange-100 text-orange-800"
            : "bg-gray-100 text-gray-700";
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
          cls,
        )}
      >
        {status}
      </span>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <h1 className="text-xl font-bold text-[#1B4332]">Rekap Absensi</h1>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7770] hover:text-[#1B4332] transition-colors"
        >
          <ArrowLeft size={15} /> Kembali ke Monitoring Kehadiran
        </button>
      </div>

      {loading ? (
        <Card>
          <LoadingState />
        </Card>
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={load} />
        </Card>
      ) : data ? (
        <>
          <Card>
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7770]">
                  Nama Peserta
                </p>
                <p className="font-bold text-[#1B4332]">{data.peserta.nama}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7770]">
                  Divisi
                </p>
                <p className="font-bold text-[#1B4332]">
                  {data.peserta.divisi}
                </p>
              </div>
              {data.peserta.tanggal_mulai && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7770]">
                    Periode Magang
                  </p>
                  <p className="font-bold text-[#1B4332]">
                    {data.peserta.tanggal_mulai} – {data.peserta.tanggal_selesai}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <div>
              <h2 className="text-base font-bold text-[#1B4332] mb-3">
                Datang & Pulang
              </h2>
              {data.mingguan.length === 0 ? (
                <Card>
                  <EmptyState label="Belum ada data absensi datang/pulang." />
                </Card>
              ) : (
                <div className="space-y-4">
                  {data.mingguan.map((m) => (
                    <Card key={m.minggu}>
                      <p className="font-bold text-[#1B4332] mb-0.5">
                        Minggu {m.minggu}
                      </p>
                      <p className="text-xs text-[#6B7770] mb-3">
                        Periode: {m.periode}
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#1B4332]/10">
                              {[
                                "Hari",
                                "Tanggal",
                                "Jam Datang",
                                "Jam Pulang",
                              ].map((h) => (
                                <th
                                  key={h}
                                  className="text-left py-2 px-3 text-[#6B7770] text-xs font-semibold uppercase tracking-wide"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {m.hari.map((h) => (
                              <tr
                                key={h.tanggal}
                                className="border-b border-[#1B4332]/5"
                              >
                                <td className="py-2.5 px-3 font-semibold text-[#1B4332]">
                                  {h.hari}
                                </td>
                                <td className="py-2.5 px-3 text-[#6B7770]">
                                  {h.tanggal}
                                </td>
                                <td className="py-2.5 px-3 text-[#3D4442]">
                                  {h.jam_masuk ?? "-"}
                                </td>
                                <td className="py-2.5 px-3 text-[#3D4442]">
                                  {h.jam_keluar ?? "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-base font-bold text-[#1B4332] mb-3">
                Izin, Sakit & Lupa Absen
              </h2>
              <Card>
                {data.izin_sakit_terlambat.length === 0 ? (
                  <EmptyState label="Tidak ada catatan izin, sakit, atau lupa absen." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#1B4332]/10">
                          {["Tanggal", "Hari", "Status", "Keterangan"].map(
                            (h) => (
                              <th
                                key={h}
                                className="text-left py-2.5 px-3 text-[#6B7770] text-xs font-semibold uppercase tracking-wide"
                              >
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {data.izin_sakit_terlambat.map((k, i) => (
                          <tr key={i} className="border-b border-[#1B4332]/5">
                            <td className="py-3 px-3 font-semibold text-[#1B4332]">
                              {k.tanggal}
                            </td>
                            <td className="py-3 px-3 text-[#6B7770]">
                              {k.hari}
                            </td>
                            <td className="py-3 px-3">
                              {kejadianBadge(k.status)}
                            </td>
                            <td className="py-3 px-3 text-[#3D4442]">
                              {k.keterangan ?? "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function AdminMonitoring() {
  const [divisi, setDivisi] = useState<Divisi[]>([]);
  const [divisiId, setDivisiId] = useState("semua");
  const [list, setList] = useState<PesertaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rekapId, setRekapId] = useState<number | null>(null);

  useEffect(() => {
    api
      .get("/divisi")
      .then((r) => setDivisi(r.data.data))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/peserta", {
        params: divisiId === "semua" ? {} : { divisi_id: divisiId },
      });
      setList(data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data kehadiran."));
    } finally {
      setLoading(false);
    }
  }, [divisiId]);

  useEffect(() => {
    load();
  }, [load]);

  if (rekapId !== null) {
    return (
      <RekapAbsensiPeserta
        pesertaMagangId={rekapId}
        onBack={() => setRekapId(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#1B4332]">
        Monitoring Rekap Kehadiran
      </h1>
      <div className="flex gap-3 flex-wrap">
        <select
          value={divisiId}
          onChange={(e) => setDivisiId(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#1B4332]/15 bg-white text-sm text-[#3D4442] focus:outline-none"
        >
          <option value="semua">Semua Divisi</option>
          {divisi.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nama}
            </option>
          ))}
        </select>
      </div>
      <Card>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : list.length === 0 ? (
          <EmptyState label="Belum ada peserta magang aktif." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1B4332]/10">
                  {[
                    "Nama",
                    "Divisi",
                    "Hadir",
                    "Total Hari",
                    "Kehadiran",
                    "Progres",
                    "Status",
                    "Rekap",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2.5 px-3 text-[#6B7770] text-xs font-semibold uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const kehadiranStatus = p.persen >= 75 ? "baik" : "perhatian";
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-[#1B4332]/5 hover:bg-[#F1F3F1]/50 transition-colors"
                    >
                      <td className="py-3 px-3 font-semibold text-[#1B4332]">
                        {p.nama}
                      </td>
                      <td className="py-3 px-3 text-[#6B7770]">{p.divisi}</td>
                      <td className="py-3 px-3 font-bold text-[#1B4332]">
                        {p.hadir}
                      </td>
                      <td className="py-3 px-3 text-[#6B7770]">
                        {p.total_absensi}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#1B4332]">
                        {p.persen}%
                      </td>
                      <td className="py-3 px-3 w-32">
                        <div className="h-2 rounded-full bg-[#F1F3F1]">
                          <div
                            className="h-2 rounded-full bg-[#1B4332]"
                            style={{ width: `${p.persen}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={kehadiranStatus} />
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setRekapId(p.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D1FAE5] text-[#1B4332] text-xs font-semibold hover:bg-[#A8C3AD] transition-colors whitespace-nowrap"
                        >
                          <ClipboardList size={13} /> Rekap
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function AdminSertifikat() {
  const [candidates, setCandidates] = useState<PesertaItem[]>([]);
  const [issued, setIssued] = useState<SertifikatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [nomorMap, setNomorMap] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [candRes, issuedRes] = await Promise.all([
        api.get("/peserta", { params: { status: "selesai" } }),
        api.get("/sertifikat", { params: { status: "terbit" } }),
      ]);
      const cands: PesertaItem[] = candRes.data.data;
      const issuedList: SertifikatItem[] = issuedRes.data.data;
      setCandidates(cands);
      setIssued(issuedList);
      // Isi nomor usulan untuk peserta yang belum pernah diketik admin di sesi
      // ini: kalau sudah pernah terbit, pakai nomor yang ada (biar kelihatan
      // apa yang akan diganti); kalau belum, usulkan nomor otomatis baru.
      setNomorMap((prev) => {
        const next = { ...prev };
        cands.forEach((p) => {
          if (next[p.id] === undefined) {
            const existing = issuedList.find(
              (s) => s.peserta_magang_id === p.id,
            );
            next[p.id] =
              existing?.nomor ??
              `SIMAGO/${new Date().getFullYear()}/${p.id.toString().padStart(4, "0")}`;
          }
        });
        return next;
      });
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data peserta."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function terbitkan(p: PesertaItem) {
    const nomor = (nomorMap[p.id] ?? "").trim();
    if (!nomor) {
      alert("Nomor sertifikat wajib diisi.");
      return;
    }
    const existing = issued.find((s) => s.peserta_magang_id === p.id);
    setBusyId(p.id);
    try {
      if (existing) {
        // Sudah pernah terbit — ganti nomor & file lamanya, bukan bikin baru.
        await api.put(`/sertifikat/${existing.id}`, { nomor });
      } else {
        await api.post("/sertifikat", {
          peserta_magang_id: p.id,
          nomor,
        });
      }
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal menerbitkan sertifikat."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#1B4332]">Kelola Sertifikat</h1>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <Card>
            <h3 className="font-bold text-[#1B4332] mb-4">
              Peserta Siap Terima Sertifikat
            </h3>
            {candidates.length === 0 ? (
              <EmptyState label="Belum ada peserta yang menyelesaikan magang." />
            ) : (
              <div className="space-y-3">
                {candidates.map((p) => {
                  const existing = issued.find(
                    (s) => s.peserta_magang_id === p.id,
                  );
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#F1F3F1] flex-wrap"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#1B4332] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {p.nama.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-40">
                        <p className="font-semibold text-[#3D4442] text-sm">
                          {p.nama}
                        </p>
                        <p className="text-xs text-[#6B7770]">{p.divisi}</p>
                        {existing && (
                          <p className="text-xs text-amber-600 mt-0.5">
                            Sudah pernah terbit — nomor & file lama akan
                            diganti.
                          </p>
                        )}
                      </div>
                      <input
                        value={nomorMap[p.id] ?? ""}
                        onChange={(e) =>
                          setNomorMap((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        placeholder="Nomor sertifikat"
                        className="px-3 py-1.5 rounded-lg border border-[#1B4332]/15 bg-white text-xs text-[#3D4442] w-44 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                      />
                      <button
                        disabled={
                          busyId === p.id || !(nomorMap[p.id] ?? "").trim()
                        }
                        onClick={() => terbitkan(p)}
                        className="px-3 py-1.5 bg-[#1B4332] text-white text-xs font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-50"
                      >
                        {busyId === p.id
                          ? "Menerbitkan..."
                          : existing
                            ? "Terbitkan Ulang"
                            : "Approve & Terbitkan"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-bold text-[#1B4332] mb-4">
              Sertifikat Sudah Terbit
            </h3>
            {issued.length === 0 ? (
              <EmptyState label="Belum ada sertifikat yang diterbitkan." />
            ) : (
              <div className="space-y-3">
                {issued.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-[#F1F3F1]"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#D1FAE5] flex items-center justify-center text-[#1B4332]">
                      <Award size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#3D4442] text-sm">
                        {s.nama}
                      </p>
                      <p className="text-xs text-[#6B7770]">
                        No. {s.nomor} — {s.divisi} — terbit {s.tanggal_terbit}
                      </p>
                    </div>
                    {s.file_url && (
                      <button
                        onClick={() => openAuthenticatedFile(s.file_url!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1B4332]/20 text-[#1B4332] text-xs font-semibold rounded-lg hover:bg-white transition-colors"
                      >
                        <Eye size={13} /> Lihat
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function AdminLaporan() {
  const [ringkasan, setRingkasan] = useState<Record<string, number | string>>(
    {},
  );
  const [riwayat, setRiwayat] = useState<PendaftarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dariTanggal, setDariTanggal] = useState("2025-07-01");
  const [sampaiTanggal, setSampaiTanggal] = useState("2025-09-30");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dash, disetujui, selesai, terbit] = await Promise.all([
        api.get("/dashboard"),
        api.get("/pendaftar", {
          params: {
            status: "disetujui",
            per_page: 50,
            dari_tanggal: dariTanggal,
            sampai_tanggal: sampaiTanggal,
          },
        }),
        api.get("/peserta", { params: { status: "selesai" } }),
        api.get("/sertifikat", { params: { status: "terbit" } }),
      ]);
      setRingkasan({
        "Total Pendaftar": dash.data.jumlah_pendaftar ?? 0,
        "Lolos Seleksi":
          disetujui.data.meta?.total ?? disetujui.data.data.length,
        "Peserta Aktif": dash.data.jumlah_peserta ?? 0,
        "Magang Selesai": selesai.data.data.length,
        "Sertifikat Terbit": terbit.data.data.length,
      });
      setRiwayat(disetujui.data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat laporan."));
    } finally {
      setLoading(false);
    }
  }, [dariTanggal, sampaiTanggal]);

  useEffect(() => {
    load();
  }, [load]);

  function exportExcel() {
    const header = ["Nama", "Institusi", "Divisi", "Periode", "Status"];
    const rows = riwayat.map((p) => [
      p.nama,
      p.institusi,
      p.divisi,
      p.periode,
      p.status,
    ]);
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      `Laporan & Rekapitulasi (${dariTanggal} s/d ${sampaiTanggal})`,
      "",
      "Ringkasan Data",
      ...Object.entries(ringkasan).map(([k, v]) => `${escape(k)},${v}`),
      "",
      header.map(escape).join(","),
      ...rows.map((r) => r.map(escape).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-rekapitulasi-${dariTanggal}-${sampaiTanggal}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    const win = window.open("", "_blank");
    if (!win) {
      alert(
        "Popup diblokir browser. Izinkan popup untuk situs ini lalu coba lagi.",
      );
      return;
    }
    const ringkasanRows = Object.entries(ringkasan)
      .map(
        ([k, v]) =>
          `<tr><td>${k}</td><td style="text-align:right">${v}</td></tr>`,
      )
      .join("");
    const riwayatRows = riwayat
      .map(
        (p) =>
          `<tr><td>${p.nama}</td><td>${p.institusi}</td><td>${p.divisi}</td><td>${p.periode}</td><td>${p.status}</td></tr>`,
      )
      .join("");
    win.document.write(`
      <html>
        <head>
          <title>Laporan & Rekapitulasi</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1B4332; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            p.periode { color: #6B7770; margin-top: 0; margin-bottom: 20px; }
            h2 { font-size: 14px; margin-top: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
            th { background: #F1F3F1; }
          </style>
        </head>
        <body>
          <h1>Laporan & Rekapitulasi Magang</h1>
          <p class="periode">Periode: ${dariTanggal} s/d ${sampaiTanggal}</p>
          <h2>Ringkasan Data</h2>
          <table>${ringkasanRows}</table>
          <h2>Riwayat Magang</h2>
          <table>
            <thead><tr><th>Nama</th><th>Institusi</th><th>Divisi</th><th>Periode</th><th>Status</th></tr></thead>
            <tbody>${riwayatRows}</tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#1B4332]">
        Laporan & Rekapitulasi
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-bold text-[#1B4332] mb-3">Filter Laporan</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#6B7770] uppercase tracking-wide block mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={dariTanggal}
                onChange={(e) => setDariTanggal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#6B7770] uppercase tracking-wide block mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={sampaiTanggal}
                onChange={(e) => setSampaiTanggal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportExcel}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors"
              >
                <Download size={14} /> Excel
              </button>
              <button
                onClick={exportPdf}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-[#1B4332]/20 text-[#1B4332] text-sm font-semibold rounded-lg hover:bg-[#D1FAE5] transition-colors"
              >
                <Download size={14} /> PDF
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-[#1B4332] mb-3">Ringkasan Data</h3>
          <div className="space-y-3">
            {Object.entries(ringkasan).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#F1F3F1]"
              >
                <span className="text-sm text-[#6B7770]">{k}</span>
                <span className="text-sm font-bold text-[#1B4332]">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold text-[#1B4332] mb-4">Riwayat Magang</h3>
        {riwayat.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1B4332]/10">
                  {["Nama", "Institusi", "Divisi", "Periode", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-2.5 px-3 text-[#6B7770] text-xs font-semibold uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {riwayat.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#1B4332]/5 hover:bg-[#F1F3F1]/50 transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-[#1B4332]">
                      {p.nama}
                    </td>
                    <td className="py-3 px-3 text-[#6B7770]">{p.institusi}</td>
                    <td className="py-3 px-3 text-[#6B7770]">{p.divisi}</td>
                    <td className="py-3 px-3 text-[#6B7770]">{p.periode}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Calon/Peserta Pages ──────────────────────────────────────────────────────

// ─── Admin: Pengumuman ──────────────────────────────────────────────────────
// Admin membuat -> otomatis Aktif -> langsung tampil di Dashboard Peserta
// -> tetap tampil selama masih Aktif -> Admin mengarsipkan -> hilang dari
// Dashboard Peserta -> tetap tersimpan sebagai Arsip/Riwayat Admin.
function AdminPengumuman({ onBack }: { onBack: () => void }) {
  const [list, setList] = useState<PengumumanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"aktif" | "arsip">("aktif");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ judul: "", isi: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [reactivatingId, setReactivatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/pengumuman", { params: { status: "semua" } });
      setList(res.data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data pengumuman."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setForm({ judul: "", isi: "" });
    setFormError("");
    setFormOpen(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await api.post("/pengumuman", form);
      setFormOpen(false);
      setTab("aktif");
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, "Gagal menyimpan pengumuman."));
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(p: PengumumanItem) {
    if (
      !confirm(
        `Arsipkan pengumuman "${p.judul}"? Pengumuman ini tidak akan lagi tampil di Dashboard Peserta, tetapi datanya tetap tersimpan sebagai riwayat.`,
      )
    )
      return;
    setArchivingId(p.id);
    try {
      await api.put(`/pengumuman/${p.id}/arsipkan`);
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal mengarsipkan pengumuman."));
    } finally {
      setArchivingId(null);
    }
  }

  async function handleReactivate(p: PengumumanItem) {
    if (
      !confirm(
        `Aktifkan kembali pengumuman "${p.judul}"? Pengumuman ini akan langsung tampil lagi di running text Dashboard Peserta.`,
      )
    )
      return;
    setReactivatingId(p.id);
    try {
      await api.put(`/pengumuman/${p.id}/aktifkan`);
      setTab("aktif");
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal mengaktifkan kembali pengumuman."));
    } finally {
      setReactivatingId(null);
    }
  }

  async function handleDelete(p: PengumumanItem) {
    if (
      !confirm(
        `Hapus permanen pengumuman "${p.judul}"? Tindakan ini tidak dapat dibatalkan.`,
      )
    )
      return;
    setDeletingId(p.id);
    try {
      await api.delete(`/pengumuman/${p.id}`);
      setSelectedIds((ids) => ids.filter((id) => id !== p.id));
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal menghapus pengumuman."));
    } finally {
      setDeletingId(null);
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  function toggleSelectAll(ids: number[]) {
    setSelectedIds((prev) => (prev.length === ids.length ? [] : ids));
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Hapus permanen ${selectedIds.length} pengumuman terpilih? Tindakan ini tidak dapat dibatalkan.`,
      )
    )
      return;
    setBulkDeleting(true);
    try {
      await Promise.all(
        selectedIds.map((id) => api.delete(`/pengumuman/${id}`)),
      );
      setSelectedIds([]);
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Sebagian pengumuman gagal dihapus."));
      load();
    } finally {
      setBulkDeleting(false);
    }
  }

  const aktifList = list.filter((p) => p.status === "aktif");
  const arsipList = list.filter((p) => p.status === "diarsipkan");
  const shown = tab === "aktif" ? aktifList : arsipList;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <h1 className="text-xl font-bold text-[#1B4332]">Pengumuman</h1>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7770] hover:text-[#1B4332] transition-colors"
        >
          <ArrowLeft size={15} /> Kembali ke Dashboard
        </button>
      </div>

      <div className="flex items-center justify-end">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors"
        >
          <Plus size={15} /> Tambah Pengumuman
        </button>
      </div>

      {formOpen && (
        <Card>
          <h3 className="font-bold text-[#1B4332] mb-3">Tambah Pengumuman</h3>
          <form onSubmit={submitForm} className="space-y-3">
            <input
              required
              maxLength={200}
              value={form.judul}
              onChange={(e) =>
                setForm((f) => ({ ...f, judul: e.target.value }))
              }
              placeholder="Judul Pengumuman"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
            />
            <textarea
              required
              rows={3}
              maxLength={2000}
              value={form.isi}
              onChange={(e) => setForm((f) => ({ ...f, isi: e.target.value }))}
              placeholder="Isi Pengumuman"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
            />
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-50"
              >
                {saving ? "Mengirim..." : "Kirim Pengumuman"}
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 border border-[#1B4332]/20 text-[#1B4332] text-sm font-semibold rounded-lg hover:bg-[#D1FAE5] transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex gap-1 bg-[#F1F3F1] p-1 rounded-lg w-fit">
        {(
          [
            { key: "aktif", label: `Aktif (${aktifList.length})` },
            { key: "arsip", label: `Arsip (${arsipList.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setSelectedIds([]);
            }}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-semibold transition-colors",
              tab === t.key
                ? "bg-white text-[#1B4332] shadow-sm"
                : "text-[#6B7770] hover:text-[#3D4442]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "arsip" && arsipList.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="flex items-center gap-2 text-sm text-[#3D4442] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={
                selectedIds.length > 0 &&
                selectedIds.length === arsipList.length
              }
              onChange={() => toggleSelectAll(arsipList.map((p) => p.id))}
              className="w-4 h-4 rounded border-[#1B4332]/30 text-[#1B4332] focus:ring-[#1B4332]/20"
            />
            Pilih Semua
          </label>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} />{" "}
              {bulkDeleting
                ? "Menghapus..."
                : `Hapus Terpilih (${selectedIds.length})`}
            </button>
          )}
        </div>
      )}

      <Card>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : shown.length === 0 ? (
          <EmptyState
            label={
              tab === "aktif"
                ? "Belum ada pengumuman aktif."
                : "Belum ada pengumuman yang diarsipkan."
            }
          />
        ) : (
          <div className="space-y-3">
            {shown.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-[#1B4332]/10 bg-[#F1F3F1]/40"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    {tab === "arsip" && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="w-4 h-4 mt-1 rounded border-[#1B4332]/30 text-[#1B4332] focus:ring-[#1B4332]/20"
                      />
                    )}
                    <div>
                      <p className="font-bold text-[#1B4332]">{p.judul}</p>
                      <p className="text-sm text-[#3D4442] mt-1 whitespace-pre-line">
                        {p.isi}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-3 pt-3 border-t border-[#1B4332]/10 flex items-center justify-between flex-wrap gap-2 text-xs text-[#6B7770]">
                  <span>
                    Dibuat: {p.dibuat_pada}
                    {p.dibuat_oleh ? ` oleh ${p.dibuat_oleh}` : ""}
                    {p.diarsipkan_pada && (
                      <> · Diarsipkan: {p.diarsipkan_pada}</>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {p.status === "aktif" && (
                      <button
                        onClick={() => handleArchive(p)}
                        disabled={archivingId === p.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-semibold disabled:opacity-50"
                      >
                        <Archive size={13} />{" "}
                        {archivingId === p.id ? "Mengarsipkan..." : "Arsipkan"}
                      </button>
                    )}
                    {p.status === "diarsipkan" && (
                      <>
                        <button
                          onClick={() => handleReactivate(p)}
                          disabled={reactivatingId === p.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1B4332]/20 text-[#1B4332] hover:bg-[#D1FAE5] transition-colors font-semibold disabled:opacity-50"
                        >
                          <RotateCcw size={13} />{" "}
                          {reactivatingId === p.id
                            ? "Mengaktifkan..."
                            : "Aktifkan Kembali"}
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-semibold disabled:opacity-50"
                        >
                          <Trash2 size={13} />{" "}
                          {deletingId === p.id ? "Menghapus..." : "Hapus"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function PengumumanTicker() {
  const [items, setItems] = useState<PengumumanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .get("/pengumuman/aktif")
      .then((res) => {
        if (mounted) setItems(res.data.data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
  if (loading || items.length === 0) return null;

  return (
    <div className="flex items-stretch rounded-xl overflow-hidden border border-[#1B4332]/15 bg-white">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#1B4332] text-white shrink-0">
        <Megaphone size={16} />
        <span className="text-xs font-bold uppercase tracking-wide whitespace-nowrap">
          Pengumuman
        </span>
      </div>
      <div className="flex-1 overflow-hidden py-3">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((i) => (
            <div
              key={i}
              aria-hidden={i === 1 ? true : undefined}
              className="flex items-center shrink-0"
            >
              {items.map((p, index) => (
                <div
                  key={`${i}-${p.id}`}
                  className="flex items-center shrink-0"
                >
                  <div className="flex flex-col justify-center px-6">
                    <p className="text-sm font-medium text-[#3D4442] whitespace-nowrap">
                      {p.judul}: {p.isi}
                    </p>
                    <p className="text-xs text-[#6B7770] mt-1 whitespace-nowrap">
                      {p.dibuat_pada}
                    </p>
                  </div>
                  {index < items.length - 1 && (
                    <span className="text-[#6B7770] px-2 shrink-0"></span>
                  )}
                </div>
              ))}
              <span className="text-[#6B7770] px-2 shrink-0"></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalonDashboard({ userStatus }: { userStatus: "calon" | "peserta" }) {
  const isPeserta = userStatus === "peserta";
  const [d, setD] = useState<any>(null);
  const [periodeDibuka, setPeriodeDibuka] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dash, periode] = await Promise.all([
        api.get("/dashboard"),
        api.get("/pengaturan/periode"),
      ]);
      setD(dash.data);
      setPeriodeDibuka(periode.data.dibuka);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const hariBerjalan = d?.hari_berjalan ?? 0;
  const totalHari = d?.total_hari ?? 0;
  const progresPct = totalHari
    ? Math.round((hariBerjalan / totalHari) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {isPeserta && <PengumumanTicker />}

      <div
        className={cn(
          "rounded-2xl p-5 flex items-start gap-4",
          isPeserta
            ? "bg-[#1B4332] text-white"
            : "bg-amber-50 border border-amber-200",
        )}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            isPeserta ? "bg-white/20" : "bg-amber-200",
          )}
        >
          {isPeserta ? (
            <CheckCircle size={20} className="text-white" />
          ) : (
            <Clock size={20} className="text-amber-700" />
          )}
        </div>
        <div>
          <p
            className={cn(
              "font-bold text-base",
              isPeserta ? "text-white" : "text-amber-900",
            )}
          >
            {isPeserta
              ? "Selamat! Kamu adalah Peserta Magang Aktif"
              : `Status Pendaftaran: ${d?.status_pendaftaran === "belum-daftar" ? "Belum Mendaftar" : (d?.status_pendaftaran ?? "Menunggu Seleksi")}`}
          </p>
          <p
            className={cn(
              "text-sm mt-0.5",
              isPeserta ? "text-white/70" : "text-amber-700",
            )}
          >
            {isPeserta
              ? `Periode: ${d?.periode ?? "-"} | Divisi: ${d?.divisi ?? "-"}`
              : "Berkas kamu sedang diverifikasi oleh admin. Cek halaman Tracking Status untuk detailnya."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isPeserta ? (
          <>
            <SummaryCard
              icon={<Calendar size={18} className="text-[#1B4332]" />}
              label="Hari Magang"
              value={`${hariBerjalan}/${totalHari}`}
              color="bg-[#D1FAE5]"
            />
            <SummaryCard
              icon={<CheckCircle size={18} className="text-[#1B4332]" />}
              label="Kehadiran"
              value={`${d?.persentase_kehadiran ?? 0}%`}
              color="bg-[#D1FAE5]"
            />
            <SummaryCard
              icon={<BookOpen size={18} className="text-amber-700" />}
              label="Laporan Dibuat"
              value={d?.laporan_dibuat ?? 0}
              color="bg-amber-100"
            />
            <SummaryCard
              icon={<Award size={18} className="text-[#1B4332]" />}
              label="Status Sertifikat"
              value={
                d?.status_sertifikat === "terbit"
                  ? "Terbit"
                  : d?.status_sertifikat === "proses"
                    ? "Proses"
                    : "Belum Ada"
              }
              color="bg-[#D1FAE5]"
            />
          </>
        ) : (
          <>
            <SummaryCard
              icon={<FileCheck size={18} className="text-[#1B4332]" />}
              label="Dokumen Terverifikasi"
              value={`${d?.dokumen_terverifikasi ?? 0}/${d?.dokumen_total ?? 0}`}
              color="bg-[#D1FAE5]"
            />
            <SummaryCard
              icon={<Clock size={18} className="text-amber-700" />}
              label="Menunggu Review"
              value={d?.dokumen_menunggu ?? 0}
              color="bg-amber-100"
            />
            <SummaryCard
              icon={<AlertCircle size={18} className="text-red-600" />}
              label="Perlu Revisi"
              value={d?.dokumen_revisi ?? 0}
              color="bg-red-100"
            />
            <SummaryCard
              icon={<FileText size={18} className="text-[#6B7770]" />}
              label="Total Dokumen"
              value={d?.dokumen_total ?? 0}
              color="bg-gray-100"
            />
          </>
        )}
      </div>

      {!isPeserta && (
        <>
          {!periodeDibuka && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle size={18} className="text-red-600" />
              </div>
              <div>
                <p className="font-bold text-red-700 text-sm">
                  Periode Pendaftaran Magang Sedang Ditutup
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  Admin sedang menutup pendaftaran magang untuk sementara.
                  Silakan cek kembali di lain waktu. Kamu tetap bisa membaca
                  syarat & ketentuan di bawah untuk persiapan.
                </p>
              </div>
            </div>
          )}

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={18} className="text-[#1B4332]" />
              <h3 className="font-bold text-[#1B4332]">
                Syarat & Ketentuan Pendaftaran Magang
              </h3>
            </div>

            <p className="text-sm text-[#6B7770] mb-4">
              Sebelum mendaftar, siapkan 7 dokumen berikut. Seluruh dokumen
              wajib diunggah dan dikirim melalui halaman{" "}
              <strong className="text-[#3D4442]">Upload Dokumen</strong> sebelum
              berkas kamu bisa diverifikasi oleh admin.
            </p>

            <div className="space-y-3">
              {[
                {
                  nama: "1. Curriculum Vitae (CV)",
                  ket: "CV terbaru berisi data diri, riwayat pendidikan, dan kemampuan/keahlian yang relevan dengan divisi yang dituju.",
                },
                {
                  nama: "2. Surat Pengantar",
                  ket: "Surat pengantar resmi dari kampus/sekolah asal yang ditujukan kepada Dinas Kependudukan dan Pencatatan Sipil Kabupaten Madiun, lengkap dengan kop surat dan tanda tangan/cap pihak kampus.",
                },
                {
                  nama: "3. Surat Pengantar Bakesbangpol Kabupaten Madiun",
                  ket: "Surat rekomendasi/izin magang dari Badan Kesatuan Bangsa dan Politik (Bakesbangpol) Kabupaten Madiun — syarat wajib untuk magang di instansi pemerintah daerah.",
                },
                {
                  nama: "4. Transkrip Nilai",
                  ket: "Transkrip nilai akademik terbaru (minimal sampai semester berjalan), ditandatangani/dilegalisir oleh pihak kampus.",
                },
                {
                  nama: "5. Kartu Tanda Mahasiswa (KTM)",
                  ket: "KTM yang masih berlaku dan masih aktif sebagai mahasiswa pada periode pengajuan magang.",
                },
                {
                  nama: "6. Pas Foto 4x6",
                  ket: "Pas foto formal terbaru (maksimal 6 bulan terakhir), berlatar belakang merah atau biru, mengenakan pakaian rapi dan sopan.",
                },
                {
                  nama: "7. Proposal",
                  ket: "Proposal pengajuan magang yang memuat latar belakang, tujuan, jadwal/periode, dan rencana kegiatan magang di divisi yang dituju, disetujui oleh kampus/sekolah asal.",
                },
              ].map((item) => (
                <div
                  key={item.nama}
                  className="p-3 rounded-lg bg-[#F1F3F1] border border-[#1B4332]/8"
                >
                  <p className="font-semibold text-[#3D4442] text-sm">
                    {item.nama}
                  </p>
                  <p className="text-xs text-[#6B7770] mt-0.5">{item.ket}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[#1B4332]/10 space-y-1.5 text-xs text-[#6B7770]">
              <p className="font-semibold text-[#3D4442] uppercase tracking-wide text-[11px] mb-1">
                Ketentuan Umum
              </p>
              <p>• Format file yang diterima: PDF, DOCX, JPG, atau PNG.</p>
              <p>• Ukuran maksimal setiap file: 5MB.</p>
              <p>
                • Pastikan seluruh dokumen jelas terbaca dan tidak buram sebelum
                diunggah.
              </p>
              <p>
                • Dokumen yang sudah dikirim untuk verifikasi tidak dapat
                diganti, kecuali ditolak admin dan diminta unggah ulang.
              </p>
              <p>
                • Pendaftaran hanya dapat diajukan selama periode pendaftaran
                sedang dibuka oleh admin.
              </p>
            </div>
          </Card>
        </>
      )}

      {isPeserta && (
        <Card>
          <h3 className="font-bold text-[#1B4332] mb-3">Progres Magang</h3>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[#6B7770]">
              Hari ke-{hariBerjalan} dari {totalHari}
            </span>
            <span className="font-bold text-[#1B4332]">{progresPct}%</span>
          </div>
          <div className="h-3 rounded-full bg-[#F1F3F1]">
            <div
              className="h-3 rounded-full bg-[#1B4332]"
              style={{ width: `${progresPct}%` }}
            />
          </div>
        </Card>
      )}

      {isPeserta && <AbsensiHariIni />}
    </div>
  );
}

/**
 * Menu "Pendaftaran" — satu pintu untuk seluruh alur calon peserta:
 * belum pernah daftar → form; sudah pernah → riwayat; pilih satu →
 * tracking (dengan upload dokumen tergabung di dalamnya).
 */
function PendaftaranPage({
  selectedPendaftaranId,
  setSelectedPendaftaranId,
}: {
  selectedPendaftaranId: number | null;
  setSelectedPendaftaranId: (id: number | null) => void;
}) {
  const [riwayat, setRiwayat] = useState<PendaftarItem[] | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadRiwayat = useCallback(async () => {
    setError("");
    try {
      const { data } = await api.get("/pendaftaran/riwayat");
      setRiwayat(data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat riwayat pendaftaran."));
    }
  }, []);

  useEffect(() => {
    loadRiwayat();
  }, [loadRiwayat]);

  if (selectedPendaftaranId) {
    return (
      <TrackingStatus
        pendaftaranId={selectedPendaftaranId}
        onBack={() => setSelectedPendaftaranId(null)}
        onDaftarUlang={() => {
          setSelectedPendaftaranId(null);
          setShowForm(true);
        }}
      />
    );
  }

  if (riwayat === null) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={loadRiwayat} />;

  if (showForm || riwayat.length === 0) {
    return (
      <FormPendaftaran
        onSubmitted={(id) => {
          setShowForm(false);
          setSelectedPendaftaranId(id);
          loadRiwayat();
        }}
      />
    );
  }

  return (
    <RiwayatPendaftaran
      onSelect={setSelectedPendaftaranId}
      onDaftarBaru={() => setShowForm(true)}
    />
  );
}

function FormPendaftaran({
  onSubmitted,
}: {
  onSubmitted: (id: number) => void;
}) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const stepLabels = ["Data Diri", "Institusi", "Detail Magang", "Review"];

  const [periodOpen, setPeriodOpen] = useState<boolean | null>(null); // null = belum dicek
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    nama: "",
    nim: "",
    tanggal_lahir: "",
    no_hp: "",
    institusi: "",
    jurusan: "",
    semester: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
    divisi_id: "",
    motivasi: "",
  });

  useEffect(() => {
    api
      .get("/divisi")
      .then((r) => setDivisiList(r.data.data))
      .catch(() => {});
  }, []);
  useEffect(() => {
    api
      .get("/pengaturan/periode")
      .then((r) => setPeriodOpen(r.data.dibuka))
      .catch(() => setPeriodOpen(true)); // gagal cek → jangan sampai memblokir tanpa alasan jelas
  }, []);

  const set =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const { data } = await api.post("/pendaftaran", {
        ...form,
        divisi_id: Number(form.divisi_id),
      });
      onSubmitted(data.data.id);
    } catch (err) {
      setSubmitError(apiErrorMessage(err, "Gagal mengirim pendaftaran."));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedDivisi = divisiList.find(
    (d) => d.id === Number(form.divisi_id),
  );

  if (periodOpen === null) return <LoadingState />;

  if (periodOpen === false) {
    return (
      <div className="max-w-xl mx-auto">
        <Card className="text-center py-10">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircle size={26} className="text-red-600" />
          </div>
          <h3 className="font-bold text-[#1B4332] text-lg">
            Pendaftaran Sedang Ditutup
          </h3>
          <p className="text-sm text-[#6B7770] mt-2 max-w-sm mx-auto">
            Admin sedang menutup periode pendaftaran magang saat ini. Silakan
            cek kembali di lain waktu untuk mengajukan pendaftaran.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-[#1B4332]">
        Form Pendaftaran Magang
      </h1>

      {/* Stepper */}
      <div className="flex items-center">
        {stepLabels.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <div key={n} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                    done
                      ? "bg-[#1B4332] border-[#1B4332] text-white"
                      : active
                        ? "bg-white border-[#1B4332] text-[#1B4332]"
                        : "bg-white border-[#6B7770]/30 text-[#6B7770]",
                  )}
                >
                  {done ? <Check size={14} /> : n}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1 font-medium",
                    active ? "text-[#1B4332]" : "text-[#6B7770]",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 mb-4 rounded-full",
                    done ? "bg-[#1B4332]" : "bg-[#6B7770]/20",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <Card>
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-[#1B4332]">Step 1: Data Diri</h3>
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                Nama Lengkap
              </label>
              <input
                value={form.nama}
                onChange={set("nama")}
                placeholder="Nama Lengkap"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 transition"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                NIM / NIS
              </label>
              <input
                value={form.nim}
                onChange={set("nim")}
                placeholder="215150401111009"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 transition"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={form.tanggal_lahir}
                onChange={set("tanggal_lahir")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 transition"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                No. HP (WhatsApp)
              </label>
              <input
                type="tel"
                value={form.no_hp}
                onChange={set("no_hp")}
                placeholder="+62 812-3456-7890"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 transition"
              />
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-[#1B4332]">Step 2: Asal Institusi</h3>
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                Nama Kampus / Sekolah
              </label>
              <input
                value={form.institusi}
                onChange={set("institusi")}
                placeholder="Universitas Brawijaya Malang"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 transition"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                Jurusan / Program Studi
              </label>
              <input
                value={form.jurusan}
                onChange={set("jurusan")}
                placeholder="Ilmu Komputer"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 transition"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                Semester / Kelas
              </label>
              <input
                value={form.semester}
                onChange={set("semester")}
                placeholder="6"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 transition"
              />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-[#1B4332]">Step 3: Detail Magang</h3>
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                Tanggal Mulai Magang
              </label>
              <input
                type="date"
                value={form.tanggal_mulai}
                onChange={set("tanggal_mulai")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                Tanggal Selesai Magang
              </label>
              <input
                type="date"
                value={form.tanggal_selesai}
                onChange={set("tanggal_selesai")}
                min={form.tanggal_mulai || undefined}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                Divisi / Bidang yang Dituju
              </label>
              <div className="space-y-2">
                {divisiList.map((d) => (
                  <label
                    key={d.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-[#1B4332]/15 cursor-pointer hover:bg-[#F1F3F1] transition-colors"
                  >
                    <input
                      type="radio"
                      name="divisi"
                      checked={Number(form.divisi_id) === d.id}
                      onChange={() =>
                        setForm((f) => ({ ...f, divisi_id: d.id.toString() }))
                      }
                      className="accent-[#1B4332]"
                    />
                    <span className="text-sm font-medium text-[#3D4442]">
                      {d.nama}
                    </span>
                    <span className="ml-auto text-xs text-[#6B7770]">
                      Sisa kuota: {d.sisa_kuota}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                Motivasi Singkat
              </label>
              <textarea
                rows={3}
                value={form.motivasi}
                onChange={set("motivasi")}
                placeholder="Tulis motivasi kamu mengikuti magang di sini..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 transition resize-none"
              />
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-bold text-[#1B4332]">
              Step 4: Review & Submit
            </h3>
            {[
              {
                section: "Data Diri",
                items: [
                  ["Nama", form.nama],
                  ["NIM", form.nim],
                  ["Tgl Lahir", form.tanggal_lahir],
                  ["No. HP", form.no_hp],
                ],
              },
              {
                section: "Institusi",
                items: [
                  ["Kampus", form.institusi],
                  ["Jurusan", form.jurusan],
                  ["Semester", form.semester],
                ],
              },
              {
                section: "Detail Magang",
                items: [
                  ["Mulai", form.tanggal_mulai || "-"],
                  ["Selesai", form.tanggal_selesai || "-"],
                  ["Divisi", selectedDivisi?.nama ?? "-"],
                  ["Motivasi", form.motivasi || "-"],
                ],
              },
            ].map(({ section, items }) => (
              <div key={section} className="p-3.5 rounded-xl bg-[#F1F3F1]">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-[#1B4332] text-sm">{section}</p>
                </div>
                <div className="space-y-1">
                  {items.map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-sm">
                      <span className="text-[#6B7770] w-24 flex-shrink-0">
                        {k}
                      </span>
                      <span className="text-[#3D4442] font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {submitError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle size={15} /> {submitError}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 border border-[#1B4332]/20 text-[#1B4332] text-sm font-semibold rounded-lg hover:bg-[#D1FAE5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={15} /> Sebelumnya
          </button>
          <button
            disabled={
              submitting ||
              (step === 3 &&
                (!form.divisi_id ||
                  !form.tanggal_mulai ||
                  !form.tanggal_selesai))
            }
            onClick={() =>
              step === totalSteps
                ? handleSubmit()
                : setStep(Math.min(totalSteps, step + 1))
            }
            className="flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-50"
          >
            {submitting
              ? "Mengirim..."
              : step === totalSteps
                ? "Submit Pendaftaran"
                : "Selanjutnya"}{" "}
            <ArrowRight size={15} />
          </button>
        </div>
      </Card>
    </div>
  );
}

function UploadDokumen({
  embedded = false,
  onChanged,
}: {
  embedded?: boolean;
  onChanged?: () => void;
}) {
  const [docs, setDocs] = useState<DokumenItem[]>([]);
  const [sudahDikirim, setSudahDikirim] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingDocId = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/dokumen/saya");
      setDocs(data.data);
      setSudahDikirim(!!data.dokumen_dikirim);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data dokumen."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function triggerUpload(docId: number) {
    pendingDocId.current = docId;
    fileInputRef.current?.click();
  }

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const docId = pendingDocId.current;
    e.target.value = ""; // supaya bisa pilih file yang sama lagi kalau perlu re-upload
    if (!file || !docId) return;

    setUploadingId(docId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/dokumen/${docId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await load();
      onChanged?.();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal mengunggah dokumen."));
    } finally {
      setUploadingId(null);
    }
  }

  async function handleKirimBerkas() {
    setSendError("");
    setSending(true);
    try {
      await api.put("/pendaftaran/kirim-dokumen");
      await load();
      onChanged?.();
    } catch (err) {
      setSendError(apiErrorMessage(err, "Gagal mengirim berkas."));
    } finally {
      setSending(false);
    }
  }

  const uploadedCount = docs.filter((d) => !!d.file_url).length;
  const pct = docs.length ? Math.round((uploadedCount / docs.length) * 100) : 0;
  const semuaTerupload = docs.length > 0 && uploadedCount === docs.length;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className={embedded ? "space-y-4" : "space-y-5 max-w-2xl mx-auto"}>
      {!embedded && (
        <h1 className="text-xl font-bold text-[#1B4332]">Upload Dokumen</h1>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChosen}
      />

      {sudahDikirim && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#D1FAE5] border border-[#1B4332]/20 text-[#1B4332] text-sm">
          <CheckCircle size={16} className="flex-shrink-0" /> Berkas sudah
          dikirim dan sedang diverifikasi admin. Dokumen tidak bisa diubah lagi,
          kecuali ada yang ditolak dan perlu diunggah ulang.
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#3D4442]">
            Total Kelengkapan: {uploadedCount} dari {docs.length} dokumen
          </span>
          <span className="text-sm font-bold text-[#1B4332]">{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-[#F1F3F1] mb-4">
          <div
            className="h-2.5 rounded-full bg-[#1B4332] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        {docs.length === 0 ? (
          <EmptyState label="Belum ada pendaftaran. Lengkapi form pendaftaran terlebih dahulu." />
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => {
              const terkunci =
                sudahDikirim &&
                doc.status !== "ditolak" &&
                doc.status !== "belum-upload";
              return (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-[#1B4332]/10 bg-[#F1F3F1]"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                        doc.status === "terverifikasi"
                          ? "bg-[#D1FAE5]"
                          : doc.status === "menunggu"
                            ? "bg-amber-100"
                            : doc.status === "ditolak"
                              ? "bg-red-100"
                              : "bg-gray-100",
                      )}
                    >
                      <FileText
                        size={16}
                        className={
                          doc.status === "terverifikasi"
                            ? "text-[#1B4332]"
                            : doc.status === "menunggu"
                              ? "text-amber-700"
                              : doc.status === "ditolak"
                                ? "text-red-600"
                                : "text-gray-400"
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#3D4442] text-sm">
                        {doc.nama}
                      </p>
                      {doc.catatan && (
                        <p className="text-xs text-red-600 mt-0.5">
                          {doc.catatan}
                        </p>
                      )}
                      {doc.file_name && (
                        <p className="text-xs text-[#6B7770] mt-0.5">
                          {doc.file_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={doc.status} />
                      {doc.file_url && (
                        <button
                          onClick={() => openAuthenticatedFile(doc.file_url!)}
                          className="p-1.5 rounded-lg hover:bg-[#D1FAE5] text-[#1B4332] transition-colors"
                          title="Lihat file"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      {doc.status !== "terverifikasi" &&
                        (terkunci ? (
                          <span
                            title="Terkunci — berkas sudah dikirim untuk verifikasi"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-200 text-gray-500 text-xs font-semibold"
                          >
                            <Fingerprint size={12} /> Terkunci
                          </span>
                        ) : (
                          <button
                            disabled={uploadingId === doc.id}
                            onClick={() => triggerUpload(doc.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1B4332] text-white text-xs font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-50"
                          >
                            <Upload size={12} />{" "}
                            {uploadingId === doc.id
                              ? "Mengunggah..."
                              : doc.file_url
                                ? "Kirim Ulang"
                                : "Upload"}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {docs.length > 0 && !sudahDikirim && (
          <div className="mt-5 pt-4 border-t border-[#1B4332]/10">
            {!semuaTerupload && (
              <p className="text-xs text-[#6B7770] mb-2">
                Lengkapi semua dokumen di atas terlebih dahulu sebelum bisa
                mengirim berkas.
              </p>
            )}
            {sendError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-3">
                <AlertCircle size={15} /> {sendError}
              </div>
            )}
            <button
              disabled={!semuaTerupload || sending}
              onClick={handleKirimBerkas}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={14} /> {sending ? "Mengirim..." : "Kirim Berkas"}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

function RiwayatPendaftaran({
  onSelect,
  onDaftarBaru,
}: {
  onSelect: (id: number) => void;
  onDaftarBaru: () => void;
}) {
  const [list, setList] = useState<PendaftarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/pendaftaran/riwayat");
      setList(data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat riwayat pendaftaran."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  // Boleh mendaftar lagi kalau pendaftaran terakhir sudah punya keputusan
  // (ditolak/kedaluwarsa) — selama masih "menunggu" tidak boleh daftar baru.
  const bolehDaftarBaru = list.length === 0 || list[0].status !== "menunggu";

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-[#1B4332]">
          Riwayat Pendaftaran
        </h1>
        {bolehDaftarBaru && (
          <button
            onClick={onDaftarBaru}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors"
          >
            <Plus size={14} /> Daftar Baru
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <Card>
          <EmptyState label="Belum ada riwayat pendaftaran. Silakan isi form pendaftaran terlebih dahulu." />
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((p) => (
            <Card
              key={p.id}
              className="flex items-center justify-between gap-4 flex-wrap"
            >
              <div>
                <p className="font-bold text-[#1B4332] text-sm">
                  Nomor Pendaftaran: PND-{String(p.id).padStart(6, "0")}
                </p>
                <p className="text-xs text-[#6B7770] mt-1">
                  Diajukan {p.tanggal} — Divisi {p.divisi}
                </p>
                <p className="text-xs text-[#6B7770] mt-0.5">
                  Periode magang: {p.periode}
                </p>
                {p.status === "menunggu" && (
                  <p className="text-xs text-[#6B7770] mt-0.5">
                    Batas pengumuman: {p.batas_pengumuman}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <StatusBadge status={p.status} />
                <button
                  onClick={() => onSelect(p.id)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors"
                >
                  <Eye size={14} /> Lihat Tracking
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Format tanggal ISO ("2026-08-17") jadi "17 Agustus 2026" — dipakai khusus
// di pesan pemberitahuan hasil seleksi (TrackingStatus), beda dari format
// pendek "17 Agt 2026" yang dipakai di tabel/daftar lain.
function formatTanggalPanjang(iso: string) {
  if (!iso) return "-";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function TrackingStatus({
  pendaftaranId,
  onBack,
  onDaftarUlang,
}: {
  pendaftaranId: number;
  onBack: () => void;
  onDaftarUlang: () => void;
}) {
  const [p, setP] = useState<PendaftarItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/pendaftaran/saya/${pendaftaranId}`);
      setP(data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat status pendaftaran."));
    } finally {
      setLoading(false);
    }
  }, [pendaftaranId]);

  useEffect(() => {
    load();
  }, [load]);

  const backButton = (
    <button
      onClick={onBack}
      className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7770] hover:text-[#1B4332] transition-colors"
    >
      <ArrowLeft size={15} /> Kembali ke Riwayat Pendaftaran
    </button>
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!p)
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <h1 className="text-xl font-bold text-[#1B4332]">
            Tracking Status Pendaftaran
          </h1>
          {backButton}
        </div>
        <EmptyState label="Pendaftaran tidak ditemukan." />
      </div>
    );

  const docCount = p.dokumen?.length ?? 0;
  const docVerified =
    p.dokumen?.every((d) => d.status === "terverifikasi") ?? false;
  const kedaluwarsa = p.status === "kedaluwarsa";
  const seleksiSelesai =
    p.status === "disetujui" || p.status === "ditolak" || kedaluwarsa;

  const steps = [
    {
      label: "Menunggu Verifikasi",
      desc: "Berkas diterima sistem",
      done: true,
      date: p.tanggal,
    },
    {
      label: "Berkas Diverifikasi",
      desc: docVerified
        ? "Seluruh dokumen sudah diverifikasi"
        : `${docCount} dokumen sedang diperiksa admin`,
      done: docVerified,
      active: !docVerified && !kedaluwarsa,
      date: docVerified
        ? "Selesai"
        : kedaluwarsa
          ? "Terlewat"
          : "Sedang berjalan",
    },
    {
      label: "Proses Seleksi",
      desc: kedaluwarsa
        ? "Batas pengumuman terlewati tanpa keputusan"
        : "Menunggu keputusan seleksi",
      done: seleksiSelesai,
      active: docVerified && !seleksiSelesai,
      date: seleksiSelesai
        ? kedaluwarsa
          ? "Kedaluwarsa"
          : "Selesai"
        : "Menunggu",
    },
    {
      label: "Pengumuman Hasil",
      desc:
        p.status === "disetujui"
          ? "Selamat, kamu lolos seleksi!"
          : p.status === "ditolak"
            ? p.catatan_admin || "Belum lolos seleksi kali ini."
            : kedaluwarsa
              ? "Pendaftaran kedaluwarsa — silakan daftar ulang."
              : "Lolos / tidak lolos seleksi",
      done: seleksiSelesai,
      date: seleksiSelesai ? p.status : "Menunggu",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <h1 className="text-xl font-bold text-[#1B4332]">
          Tracking Status Pendaftaran
        </h1>
        {backButton}
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-5",
          !seleksiSelesai && "lg:grid-cols-3",
        )}
      >
        {!seleksiSelesai && (
          <div className="lg:col-span-1 space-y-5">
            <Card>
              <div className="space-y-0">
                {steps.map((s, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 z-10",
                          s.done
                            ? "bg-[#1B4332] border-[#1B4332]"
                            : s.active
                              ? "bg-white border-[#1B4332]"
                              : "bg-white border-[#6B7770]/30",
                        )}
                      >
                        {s.done ? (
                          <Check size={14} className="text-white" />
                        ) : s.active ? (
                          <div className="w-3 h-3 rounded-full bg-[#1B4332]" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-[#6B7770]/20" />
                        )}
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          className={cn(
                            "w-0.5 flex-1 my-1",
                            s.done ? "bg-[#1B4332]" : "bg-[#6B7770]/20",
                          )}
                          style={{ minHeight: 32 }}
                        />
                      )}
                    </div>
                    <div
                      className={cn("pb-6", i === steps.length - 1 && "pb-0")}
                    >
                      <p
                        className={cn(
                          "font-bold text-sm",
                          s.done || s.active
                            ? "text-[#1B4332]"
                            : "text-[#6B7770]",
                        )}
                      >
                        {s.label}
                      </p>
                      <p className="text-xs text-[#6B7770] mt-0.5">{s.desc}</p>
                      <p className="text-xs font-medium text-[#87A08F] mt-0.5">
                        {s.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-bold text-[#1B4332] mb-2">Informasi</h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <Calendar
                    size={15}
                    className="text-[#6B7770] flex-shrink-0 mt-0.5"
                  />
                  <span className="text-[#6B7770]">
                    Estimasi pengumuman:{" "}
                    <strong className="text-[#3D4442]">
                      {p.batas_pengumuman}
                    </strong>
                  </span>
                </div>
                <div className="flex gap-2">
                  <AlertCircle
                    size={15}
                    className="text-[#6B7770] flex-shrink-0 mt-0.5"
                  />
                  <span className="text-[#6B7770]">
                    Pertanyaan? Hubungi admin di{" "}
                    <strong className="text-[#1B4332]">admin@simago.id</strong>
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className={cn("space-y-5", !seleksiSelesai && "lg:col-span-2")}>
          {p.status === "menunggu" && (
            <Card>
              <h3 className="font-bold text-[#1B4332] mb-1">
                Lengkapi & Kirim Dokumen
              </h3>
              <p className="text-xs text-[#6B7770] mb-4">
                Unggah seluruh dokumen wajib di bawah ini, lalu kirim untuk
                diverifikasi admin.
              </p>
              <UploadDokumen embedded onChanged={load} />
            </Card>
          )}

          {seleksiSelesai && (
            <Card>
              <div className="max-w-2xl mx-auto text-sm text-[#3D4442] leading-relaxed">
                {p.status === "disetujui" ? (
                  <>
                    <h2 className="text-lg font-bold text-[#1B4332] mb-3">
                      Selamat, Kamu Diterima! 🎉
                    </h2>
                    <p className="mb-3">
                      Pendaftaran magang kamu telah disetujui. Kamu resmi
                      menjadi peserta magang dan dapat melanjutkan ke tahap
                      pelaksanaan magang.
                    </p>
                    <div className="mb-3 p-3 rounded-lg bg-[#F1F3F1] space-y-1">
                      <p>
                        <span className="text-[#6B7770]">Penempatan:</span>{" "}
                        <strong className="text-[#1B4332]">{p.divisi}</strong>
                      </p>
                      <p>
                        <span className="text-[#6B7770]">Periode:</span>{" "}
                        <strong className="text-[#1B4332]">
                          {formatTanggalPanjang(p.tanggal_mulai)} –{" "}
                          {formatTanggalPanjang(p.tanggal_selesai)}
                        </strong>
                      </p>
                    </div>
                    <p className="mb-3">
                      Mulai dari periode tersebut, kamu sudah dapat mengikuti
                      kegiatan magang serta mengisi absensi dan laporan harian
                      melalui SIMAGO.
                    </p>
                    <p className="mb-3">
                      Silakan cek menu Tracking untuk melihat informasi dan
                      perkembangan kegiatan magang kamu.
                    </p>
                    <p>
                      Selamat menjalankan kegiatan magang! Semoga pengalaman ini
                      menjadi kesempatan untuk belajar, berkembang, dan
                      mendapatkan pengalaman baru.
                    </p>
                  </>
                ) : kedaluwarsa ? (
                  <>
                    <h2 className="text-lg font-bold text-amber-700 mb-3">
                      Pendaftaran Kamu Kedaluwarsa
                    </h2>
                    <p className="mb-3">
                      Batas waktu pengumuman untuk pendaftaran ini sudah
                      terlewati tanpa ada keputusan dari admin. Ini{" "}
                      <strong>bukan berarti kamu ditolak</strong> — murni karena
                      keterlambatan proses di sisi kami.
                    </p>
                    <p className="mb-3">
                      Kamu tetap bisa mengajukan pendaftaran baru kapan saja
                      untuk mencoba kembali.
                    </p>
                    <p>
                      Mohon maaf atas ketidaknyamanannya, dan terima kasih atas
                      kesabaran serta minat kamu mendaftar magang di sini.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-red-700 mb-3">
                      Mohon Maaf, Kamu Belum Diterima
                    </h2>
                    <p className="mb-3">
                      Setelah melalui proses seleksi, kami belum dapat menerima
                      kamu untuk mengikuti program magang pada periode ini.
                      Keputusan ini semata-mata karena keterbatasan kuota dan
                      kebutuhan divisi saat ini, bukan karena kekurangan kamu.
                    </p>
                    <p className="mb-3">
                      Jangan berkecil hati — kamu tetap bisa mengajukan
                      pendaftaran baru kapan saja untuk mencoba kembali pada
                      periode berikutnya.
                    </p>
                    <p>
                      Terima kasih atas minat dan usaha kamu mendaftar magang di
                      sini. Semoga kesempatan berikutnya membawa hasil yang
                      lebih baik!
                    </p>
                  </>
                )}
              </div>
            </Card>
          )}

          {(p.status === "ditolak" || kedaluwarsa) && (
            <Card className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-[#3D4442]">
                {kedaluwarsa
                  ? "Pendaftaran ini sudah melewati batas pengumuman. Kamu bisa mengajukan pendaftaran baru."
                  : "Kamu bisa mengajukan pendaftaran baru untuk mencoba kembali."}
              </p>
              <button
                onClick={onDaftarUlang}
                className="flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors flex-shrink-0"
              >
                <Plus size={15} /> Daftar Baru
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

const HARI_OPTIONS = ["Senin", "Selasa", "Rabu", "Kamis", "Jum'at"];
const SIFT_OPTIONS: { value: string; label: string }[] = [
  { value: "datang", label: "Datang" },
  { value: "pulang", label: "Pulang" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "lupa_absen", label: "Lupa Absen" },
];
// Datang, Izin, Sakit, dan Lupa Absen saling eksklusif — peserta hanya boleh
// memilih salah satu dari keempatnya, satu kali, per hari. "Pulang" dikunci
// terpisah berdasarkan jam saja (lihat jamTerkunci di bawah).
const GRUP_UTAMA_SIFT = ["datang", "izin", "sakit", "lupa_absen"];

function todayHariIndonesia() {
  const days = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jum'at",
    "Sabtu",
  ];
  return days[new Date().getDay()];
}

function siftDalamJam(sift: string): boolean {
  const now = new Date();
  const menit = now.getHours() * 60 + now.getMinutes();
  if (sift === "datang") return menit >= 7 * 60 && menit <= 8 * 60;
  if (sift === "pulang") return menit >= 15 * 60 && menit <= 16 * 60;
  return true;
}

function AbsensiHariIni() {
  const [entries, setEntries] = useState<AbsensiItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [hari, setHari] = useState(todayHariIndonesia());
  const [sift, setSift] = useState("datang");
  const [keterangan, setKeterangan] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/absensi/saya");
      setEntries(data.data);
    } catch {
      // widget ini hanya perlu status hari ini; kalau gagal, cukup diamkan
      // saja supaya tidak mengganggu tampilan dashboard secara keseluruhan.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Format sama persis dengan Carbon::format('d M Y') di backend (bahasa Inggris),
  // supaya perbandingan tanggal "hari ini" akurat.
  const EN_MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const now0 = new Date();
  const todayBackendFormat = `${String(now0.getDate()).padStart(2, "0")} ${EN_MONTHS[now0.getMonth()]} ${now0.getFullYear()}`;
  const todayEntry = entries.find((e) => e.tanggal === todayBackendFormat);
  const sudahDatang = !!todayEntry?.jam_masuk;
  const sudahPulang = !!todayEntry?.jam_keluar;
  const sudahIzinSakitLupa =
    !!todayEntry &&
    (todayEntry.sift === "izin" ||
      todayEntry.sift === "sakit" ||
      todayEntry.sift === "lupa_absen");
  const labelIzinSakitLupa =
    SIFT_OPTIONS.find((o) => o.value === todayEntry?.sift)?.label ?? "";

  const perluBukti =
    sift === "izin" || sift === "sakit" || sift === "lupa_absen";

  const sudahIsiGrupUtamaHariIni =
    !!todayEntry && GRUP_UTAMA_SIFT.includes(todayEntry.sift ?? "");

  // Datang & Pulang hanya boleh dikirim di jam yang ditentukan. Izin/Sakit/
  // Lupa Absen tidak punya batas jam sama sekali.
  function jamTerkunci(s: string): boolean {
    if (s === "datang" || s === "pulang") return !siftDalamJam(s);
    return false;
  }

  // Kembalikan alasan kenapa sebuah opsi sift tidak bisa dipilih/dikirim,
  // atau null kalau opsi itu masih valid untuk dipilih.
  function alasanTerkunci(s: string): string | null {
    if (GRUP_UTAMA_SIFT.includes(s) && sudahIsiGrupUtamaHariIni) {
      return "Kamu sudah mengisi absensi hari ini (Datang/Izin/Sakit/Lupa Absen hanya bisa dipilih salah satu, satu kali per hari).";
    }
    if (s === "pulang" && sudahPulang) {
      return "Kamu sudah mengisi absensi Pulang hari ini.";
    }
    if (jamTerkunci(s)) {
      return `Saat ini di luar jam ${
        s === "datang" ? "Datang (07.00–08.00)" : "Pulang (15.00–16.00)"
      }. Opsi ini terkunci dan tidak bisa dikirim.`;
    }
    return null;
  }

  function optionTerkunci(s: string): boolean {
    return alasanTerkunci(s) !== null;
  }

  const diLuarJam = jamTerkunci(sift);
  const alasanSiftSaatIni = alasanTerkunci(sift);
  const sudahMengisiSiftIni = alasanSiftSaatIni !== null;

  // Kalau default/pilihan saat ini ternyata terkunci (misal form dibuka pas
  // sudah lewat jam Datang), otomatis lompat ke opsi pertama yang masih valid.
  useEffect(() => {
    if (!showForm) return;
    if (optionTerkunci(sift)) {
      const fallback = SIFT_OPTIONS.find((o) => !optionTerkunci(o.value));
      if (fallback) setSift(fallback.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm, todayEntry]);

  function resetForm() {
    setSift("datang");
    setKeterangan("");
    setFile(null);
    setFormError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!hari) {
      setFormError("Hari wajib diisi.");
      return;
    }
    if (!sift) {
      setFormError("Sift wajib dipilih.");
      return;
    }
    if (sudahMengisiSiftIni) {
      setFormError(
        alasanSiftSaatIni ?? "Sift ini tidak bisa dipilih saat ini.",
      );
      return;
    }
    if (perluBukti) {
      if (!keterangan.trim()) {
        setFormError(
          "Keterangan wajib diisi untuk Izin, Sakit, atau Lupa Absen.",
        );
        return;
      }
      if (!file) {
        setFormError(
          "Dokumen pendukung wajib diunggah untuk Izin, Sakit, atau Lupa Absen.",
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const jam = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const fd = new FormData();
      fd.append("sift", sift);
      if (perluBukti) {
        fd.append("keterangan", keterangan);
        if (file) fd.append("bukti", file);
      }
      if (sift === "datang") fd.append("jam_masuk", jam);
      if (sift === "pulang") fd.append("jam_keluar", jam);
      if (diLuarJam) fd.append("di_luar_jam", "1");
      await api.post("/absensi", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowForm(false);
      resetForm();
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, "Gagal mengirim absensi."));
    } finally {
      setSubmitting(false);
    }
  }

  const todayLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      <Card className="border-amber-200 bg-amber-50 mb-5">
        <div className="flex items-start gap-3">
          <div className="space-y-4 text-sm text-amber-900">
            <div>
              <p className="font-bold uppercase tracking-wide text-xs mb-1">
                Batas Pengisian Absensi
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Datang: 07.00 – 08.00</li>
                <li>Pulang: 15.00 – 16.00</li>
              </ul>
              <p className="mt-1">
                Di luar jam tersebut tidak dapat melakukan absensi. Khusus Izin,
                Sakit, dan Lupa Absen tidak ada batas jam.
              </p>
            </div>

            <div>
              <p className="font-bold uppercase tracking-wide text-xs mb-1">
                Jam Kerja
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Senin – Kamis: 07.30 – 15.30</li>
                <li>Jum'at: 07.00 – 15.00</li>
              </ul>
            </div>

            <div>
              <p className="font-bold uppercase tracking-wide text-xs mb-1">
                Seragam
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Senin – Rabu: Bebas rapi berkemeja</li>
                <li>Kamis: Baju Batik</li>
                <li>Jum'at: Baju olahraga (training & polo)</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      <Card className="flex items-center gap-4 flex-wrap">
        <div className="w-12 h-12 rounded-xl bg-[#D1FAE5] flex items-center justify-center text-[#1B4332] flex-shrink-0">
          <Fingerprint size={22} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="font-bold text-[#1B4332]">Absensi Hari Ini</p>
          <p className="text-sm text-[#6B7770]">{todayLabel}</p>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {sudahIzinSakitLupa ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#D1FAE5] text-[#1B4332]">
                Sudah Absensi ✓ {labelIzinSakitLupa}
              </span>
            ) : (
              <>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold",
                    sudahDatang
                      ? "bg-[#D1FAE5] text-[#1B4332]"
                      : "bg-gray-100 text-gray-500",
                  )}
                >
                  Datang{" "}
                  {sudahDatang ? `✓ ${todayEntry?.jam_masuk}` : "— belum"}
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold",
                    sudahPulang
                      ? "bg-[#D1FAE5] text-[#1B4332]"
                      : "bg-gray-100 text-gray-500",
                  )}
                >
                  Pulang{" "}
                  {sudahPulang ? `✓ ${todayEntry?.jam_keluar}` : "— belum"}
                </span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-5 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors"
        >
          Isi Absensi
        </button>
      </Card>

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1B4332]">Form Pengisian Absensi</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-[#6B7770] hover:text-[#1B4332] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                  Hari *
                </label>
                <select
                  value={hari}
                  onChange={(e) => setHari(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none"
                >
                  {HARI_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                  Sift *
                </label>
                <select
                  value={sift}
                  onChange={(e) => {
                    setSift(e.target.value);
                    setFormError("");
                  }}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none"
                >
                  {SIFT_OPTIONS.map((o) => (
                    <option
                      key={o.value}
                      value={o.value}
                      disabled={optionTerkunci(o.value)}
                    >
                      {o.label}
                      {optionTerkunci(o.value) ? " (terkunci)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {alasanSiftSaatIni && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertCircle size={14} className="flex-shrink-0" />{" "}
                {alasanSiftSaatIni}
              </div>
            )}

            {perluBukti && (
              <>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-3">
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                    Ketentuan Pengajuan
                  </p>

                  <div className="space-y-2.5 text-xs text-amber-900">
                    <div>
                      <p className="font-semibold mb-0.5">Izin</p>
                      <p>
                        Diterima jika mengisi keterangan sesuai bukti foto yang
                        dilampirkan, dan bukti foto wajib mengaktifkan fitur{" "}
                        <strong>timestamp</strong>. Jika tidak sesuai, izin
                        tidak akan diterima.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold mb-0.5">Sakit</p>
                      <p>
                        Diterima jika mengisi keterangan sesuai bukti foto yang
                        dilampirkan, dan bukti foto wajib mengaktifkan fitur{" "}
                        <strong>timestamp</strong> (contoh: foto obat, surat
                        keterangan dokter, kondisi, lokasi berobat). Jika tidak
                        sesuai, sakit tidak akan diterima.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold mb-0.5">Lupa Absen</p>
                      <p>
                        Digunakan saat masuk tetapi pengisian absen di luar jam
                        Datang atau Pulang. Gunakan bukti foto yang sudah
                        diaktifkan fitur <strong>timestamp</strong>. Jika tidak
                        sesuai, akan dianggap tidak masuk.
                      </p>
                    </div>
                  </div>

                  <p className="pt-2.5 border-t border-amber-200 text-xs text-amber-900">
                    Selain ketentuan di atas, jika Izin, Sakit, atau Lupa Absen{" "}
                    <strong>wajib menghubungi Admin</strong>.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                    Keterangan *
                  </label>
                  <textarea
                    rows={3}
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Jelaskan alasan izin / sakit / lupa absen..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                    Dokumen Pendukung *
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,image/*,video/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-[#3D4442] file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[#1B4332] file:text-white file:text-xs file:font-semibold"
                  />
                  <p className="text-[11px] text-[#6B7770] mt-1">
                    Format: PDF, gambar, atau video. Untuk gambar/video wajib
                    mengaktifkan fitur timestamp & merekam lokasi/GPS, jika
                    tidak sesuai maka tidak akan diterima.
                  </p>
                </div>
              </>
            )}

            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle size={15} /> {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || sudahMengisiSiftIni}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-50"
            >
              {submitting ? "Mengirim..." : "Kirim Absensi"}
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}

function PesertaLaporan() {
  const [list, setList] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    judul: "",
    tanggal: new Date().toISOString().slice(0, 10),
    isi: "",
  });

  const [revisingId, setRevisingId] = useState<number | null>(null);
  const [revisiIsi, setRevisiIsi] = useState("");
  const [revisiSubmitting, setRevisiSubmitting] = useState(false);
  const [revisiError, setRevisiError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/laporan/saya");
      setList(data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat laporan."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      await api.post("/laporan", form);
      setForm({
        judul: "",
        tanggal: new Date().toISOString().slice(0, 10),
        isi: "",
      });
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, "Gagal menyimpan laporan."));
    } finally {
      setSubmitting(false);
    }
  }

  function startRevisi(l: LaporanItem) {
    setRevisingId(l.id);
    setRevisiIsi(l.isi);
    setRevisiError("");
  }

  async function submitRevisi(id: number) {
    setRevisiSubmitting(true);
    setRevisiError("");
    try {
      await api.put(`/laporan/${id}/revisi`, { isi: revisiIsi });
      setRevisingId(null);
      load();
    } catch (err) {
      setRevisiError(apiErrorMessage(err, "Gagal mengirim revisi."));
    } finally {
      setRevisiSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-[#1B4332]">Laporan Kegiatan</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors"
        >
          <Plus size={15} /> {showForm ? "Batal" : "Buat Laporan"}
        </button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                Judul Laporan
              </label>
              <input
                required
                value={form.judul}
                onChange={(e) =>
                  setForm((f) => ({ ...f, judul: e.target.value }))
                }
                placeholder="Laporan Harian — ..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                Tanggal
              </label>
              <input
                required
                type="date"
                value={form.tanggal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tanggal: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                Isi Laporan
              </label>
              <textarea
                required
                rows={4}
                value={form.isi}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isi: e.target.value }))
                }
                placeholder="Ceritakan kegiatan magang hari ini..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 resize-none"
              />
            </div>
            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle size={15} /> {formError}
              </div>
            )}
            <button
              disabled={submitting}
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-50"
            >
              <Send size={14} /> {submitting ? "Mengirim..." : "Kirim Laporan"}
            </button>
          </form>
        </Card>
      )}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : list.length === 0 ? (
        <EmptyState label="Belum ada laporan." />
      ) : (
        <div className="space-y-3">
          {list.map((l) => (
            <Card key={l.id} className="flex items-start gap-4">
              <div
                className={cn(
                  "w-2 h-full min-h-10 rounded-full flex-shrink-0",
                  l.status === "selesai"
                    ? "bg-[#1B4332]"
                    : l.status === "perlu-revisi"
                      ? "bg-red-400"
                      : "bg-amber-400",
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="font-bold text-[#3D4442] text-sm">{l.judul}</p>
                  <StatusBadge status={l.status} />
                </div>
                <p className="text-xs text-[#6B7770] mt-1">{l.tanggal}</p>
                {l.catatan_pembimbing && (
                  <div className="mt-2 p-2 rounded-lg bg-[#F1F3F1] text-xs text-[#3D4442]">
                    <span className="font-semibold text-[#1B4332]">
                      Feedback:{" "}
                    </span>
                    {l.catatan_pembimbing}
                  </div>
                )}

                {l.status === "perlu-revisi" && revisingId !== l.id && (
                  <button
                    onClick={() => startRevisi(l)}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4332] text-white text-xs font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors"
                  >
                    <Edit2 size={12} /> Kirim Revisi
                  </button>
                )}

                {revisingId === l.id && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      rows={4}
                      value={revisiIsi}
                      onChange={(e) => setRevisiIsi(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 resize-none"
                    />
                    {revisiError && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                        <AlertCircle size={13} /> {revisiError}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        disabled={revisiSubmitting}
                        onClick={() => submitRevisi(l.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4332] text-white text-xs font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-50"
                      >
                        <Send size={12} />{" "}
                        {revisiSubmitting ? "Mengirim..." : "Kirim Revisi"}
                      </button>
                      <button
                        disabled={revisiSubmitting}
                        onClick={() => setRevisingId(null)}
                        className="px-3 py-1.5 border border-[#1B4332]/20 text-[#1B4332] text-xs font-semibold rounded-lg hover:bg-[#F1F3F1] transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PesertaSertifikat() {
  const [s, setS] = useState<SertifikatItem | null>(null);
  const [peserta, setPeserta] = useState<PesertaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotFound(false);
    try {
      const peserta = await api.get("/peserta/saya");
      setPeserta(peserta.data.data);
      try {
        const { data } = await api.get("/sertifikat/saya");
        setS(data.data);
      } catch (err: any) {
        if (err?.response?.status === 404) setNotFound(true);
        else throw err;
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data sertifikat."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const isTerbit = s?.status === "terbit";

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-[#1B4332]">Sertifikat Magang</h1>

      <Card className="text-center py-8">
        <div
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4",
            isTerbit ? "bg-[#D1FAE5]" : "bg-amber-100",
          )}
        >
          <Award
            size={28}
            className={isTerbit ? "text-[#1B4332]" : "text-amber-700"}
          />
        </div>
        <h3 className="font-bold text-[#1B4332] text-lg">
          {isTerbit
            ? "Sertifikat Sudah Terbit"
            : notFound
              ? "Sertifikat Belum Diterbitkan"
              : "Sertifikat Dalam Proses"}
        </h3>
        <p className="text-sm text-[#6B7770] mt-2 max-w-xs mx-auto">
          {isTerbit
            ? `Sertifikat kamu telah terbit pada ${s?.tanggal_terbit}.`
            : notFound
              ? "Sertifikat akan diterbitkan admin setelah masa magang selesai."
              : "Sertifikat kamu sedang diproses oleh admin."}
        </p>
        {isTerbit && s?.file_url && (
          <button
            onClick={() => openAuthenticatedFile(s.file_url!)}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors"
          >
            <Download size={14} /> Unduh Sertifikat
          </button>
        )}
        {peserta && (
          <div className="mt-5 p-4 rounded-xl bg-[#F1F3F1] text-left max-w-xs mx-auto">
            <div className="space-y-2 text-sm">
              {[
                ["Nama", peserta.nama],
                ["Divisi", peserta.divisi],
                [
                  "Periode",
                  `${peserta.tanggal_mulai} – ${peserta.tanggal_selesai}`,
                ],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-[#6B7770]">{k}</span>
                  <span className="font-medium text-[#3D4442]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function PesertaProfil() {
  const [profil, setProfil] = useState<any>(null);
  const [peserta, setPeserta] = useState<PesertaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    institusi: "",
    jurusan: "",
    semester: "",
    noHp: "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/profil");
      setProfil(data);
      setForm({
        nama: data.nama ?? "",
        institusi: data.mahasiswa?.institusi ?? "",
        jurusan: data.mahasiswa?.jurusan ?? "",
        semester: data.mahasiswa?.semester ?? "",
        noHp: data.mahasiswa?.no_hp ?? "",
        password: "",
      });
      if (data.role === "peserta") {
        try {
          const p = await api.get("/peserta/saya");
          setPeserta(p.data.data);
        } catch {
          // belum tercatat sebagai peserta aktif, biarkan kosong
        }
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat profil."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProfil() {
    setSaving(true);
    setSaveError("");
    try {
      const payload: Record<string, string> = {
        nama: form.nama,
        institusi: form.institusi,
        jurusan: form.jurusan,
        semester: form.semester,
        no_hp: form.noHp,
      };
      if (form.password) payload.password = form.password;
      await api.put("/profil", payload);
      setEditing(false);
      setForm((f) => ({ ...f, password: "" }));
      load();
    } catch (err) {
      setSaveError(apiErrorMessage(err, "Gagal menyimpan profil."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!profil) return null;

  const fields: [string, string][] = [
    ["NIM", profil.mahasiswa?.nim ?? "-"],
    ["Kampus", profil.mahasiswa?.institusi ?? "-"],
    ["Jurusan", profil.mahasiswa?.jurusan ?? "-"],
    ["Semester", profil.mahasiswa?.semester ?? "-"],
    ["No. HP", profil.mahasiswa?.no_hp ?? "-"],
    ...(peserta
      ? ([
          ["Divisi", peserta.divisi],
          ["Status", "Peserta Aktif"],
        ] as [string, string][])
      : []),
  ];

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-[#1B4332]">Profil Saya</h1>
      <Card>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-[#1B4332] flex items-center justify-center text-white text-2xl font-bold">
            {profil.nama.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-[#1B4332] text-lg">{profil.nama}</p>
            <p className="text-sm text-[#6B7770]">{profil.email}</p>
          </div>
          <button
            onClick={() => setEditing((e) => !e)}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 border border-[#1B4332]/20 text-[#1B4332] text-sm font-semibold rounded-lg hover:bg-[#D1FAE5] transition-colors"
          >
            <Edit2 size={13} /> {editing ? "Batal" : "Edit"}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                Nama
              </label>
              <input
                value={form.nama}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nama: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                  Kampus
                </label>
                <input
                  value={form.institusi}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, institusi: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                  Jurusan
                </label>
                <input
                  value={form.jurusan}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, jurusan: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                  Semester
                </label>
                <input
                  value={form.semester}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, semester: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                  No. HP (WhatsApp)
                </label>
                <input
                  value={form.noHp}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, noHp: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                Password Baru (kosongkan jika tidak diubah)
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
              />
            </div>
            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            <button
              disabled={saving}
              onClick={saveProfil}
              className="px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {fields.map(([k, v]) => (
              <div key={k} className="p-3 rounded-xl bg-[#F1F3F1]">
                <p className="text-[10px] font-semibold text-[#6B7770] uppercase tracking-wide">
                  {k}
                </p>
                <p className="text-sm font-semibold text-[#3D4442] mt-0.5">
                  {v}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Detail Peserta (Admin) ─────────────────────────────────────────────────

function DetailPeserta({
  pesertaId,
  onBack,
}: {
  pesertaId: number;
  onBack: () => void;
}) {
  const [profil, setProfil] = useState<PesertaItem | null>(null);
  const [absensi, setAbsensi] = useState<AbsensiItem[]>([]);
  const [laporan, setLaporan] = useState<LaporanItem[]>([]);
  const [rekomendasi, setRekomendasi] = useState<RekomendasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"absensi" | "laporan" | "rekomendasi">(
    "absensi",
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [p, a, l, r] = await Promise.all([
        api.get(`/peserta/${pesertaId}`),
        api.get("/absensi", {
          params: { peserta_magang_id: pesertaId, per_page: 100 },
        }),
        api.get("/laporan", {
          params: { peserta_magang_id: pesertaId, per_page: 100 },
        }),
        api.get(`/peserta/${pesertaId}/rekomendasi`),
      ]);
      setProfil(p.data.data);
      setAbsensi(a.data.data);
      setLaporan(l.data.data);
      setRekomendasi(r.data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat detail peserta."));
    } finally {
      setLoading(false);
    }
  }, [pesertaId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Review laporan ──
  const [selectedLaporan, setSelectedLaporan] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submittingLaporan, setSubmittingLaporan] = useState<
    "selesai" | "perlu-revisi" | null
  >(null);
  const currentLaporan = laporan.find((x) => x.id === selectedLaporan) ?? null;

  useEffect(() => {
    setFeedback(currentLaporan?.catatan_pembimbing ?? "");
  }, [currentLaporan?.id]);

  async function reviewLaporan(status: "selesai" | "perlu-revisi") {
    if (!currentLaporan) return;
    setSubmittingLaporan(status);
    try {
      await api.put(`/laporan/${currentLaporan.id}/review`, {
        status,
        catatan_pembimbing: feedback || undefined,
      });
      await load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal mengirim review."));
    } finally {
      setSubmittingLaporan(null);
    }
  }

  // ── Rekomendasi baru ──
  const [rating, setRating] = useState<Record<string, number>>({
    kedisiplinan: 4,
    teknis: 4,
    sikap: 4,
    inisiatif: 4,
  });
  const [catatanRekomendasi, setCatatanRekomendasi] = useState("");
  const [submittingRekomendasi, setSubmittingRekomendasi] = useState(false);

  async function submitRekomendasi() {
    setSubmittingRekomendasi(true);
    try {
      await api.post(`/peserta/${pesertaId}/rekomendasi`, {
        ...rating,
        catatan: catatanRekomendasi || undefined,
      });
      setCatatanRekomendasi("");
      await load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal mengirim rekomendasi."));
    } finally {
      setSubmittingRekomendasi(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!profil) return <EmptyState label="Data peserta tidak ditemukan." />;

  const laporanDireview = laporan.filter((l) => l.status === "selesai").length;
  const absensiHadir = absensi.filter((a) => a.status === "hadir").length;

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-[#1B4332] hover:underline"
      >
        <ArrowLeft size={14} /> Kembali
      </button>

      <Card>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-[#1B4332] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {profil.nama.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-[#1B4332]">
                {profil.nama}
              </h1>
              <StatusBadge status={profil.status} />
            </div>
            <p className="text-sm text-[#6B7770] mt-0.5">{profil.institusi}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm">
              <div>
                <p className="text-xs text-[#6B7770]">Divisi</p>
                <p className="font-medium text-[#3D4442]">{profil.divisi}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B7770]">Periode Magang</p>
                <p className="font-medium text-[#3D4442]">
                  {profil.tanggal_mulai} – {profil.tanggal_selesai}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6B7770]">Hari Berjalan</p>
                <p className="font-medium text-[#3D4442]">
                  {profil.hari_berjalan}/{profil.total_hari} hari
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Calendar size={18} className="text-[#1B4332]" />}
          label="Kehadiran"
          value={`${profil.persen}%`}
          sub={`${absensiHadir}/${absensi.length} hadir`}
          color="bg-[#D1FAE5]"
        />
        <SummaryCard
          icon={<BookOpen size={18} className="text-[#1B4332]" />}
          label="Laporan Dikirim"
          value={laporan.length}
          color="bg-[#D1FAE5]"
        />
        <SummaryCard
          icon={<CheckCircle size={18} className="text-[#1B4332]" />}
          label="Laporan Direview"
          value={laporanDireview}
          color="bg-[#D1FAE5]"
        />
        <SummaryCard
          icon={<Award size={18} className="text-amber-700" />}
          label="Status Magang"
          value={profil.status === "selesai" ? "Selesai" : "Berjalan"}
          color="bg-amber-100"
        />
      </div>

      <div className="flex gap-2 border-b border-[#1B4332]/10">
        {(
          [
            ["absensi", "Riwayat Absensi"],
            ["laporan", "Laporan Harian"],
            ["rekomendasi", "Rekomendasi"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors",
              tab === key
                ? "border-[#1B4332] text-[#1B4332]"
                : "border-transparent text-[#6B7770] hover:text-[#3D4442]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "absensi" && (
        <Card>
          {absensi.length === 0 ? (
            <EmptyState label="Belum ada riwayat absensi." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1B4332]/10">
                    {[
                      "Tanggal",
                      "Sift",
                      "Masuk",
                      "Keluar",
                      "Keterangan",
                      "Bukti",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2.5 px-3 text-[#6B7770] text-xs font-semibold uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {absensi.map((e) => (
                    <tr key={e.id} className="border-b border-[#1B4332]/5">
                      <td className="py-3 px-3 text-[#6B7770]">{e.tanggal}</td>
                      <td className="py-3 px-3 text-[#6B7770] capitalize">
                        {SIFT_OPTIONS.find((o) => o.value === e.sift)?.label ??
                          "-"}
                      </td>
                      <td className="py-3 px-3 font-mono text-sm text-[#3D4442]">
                        {e.jam_masuk ?? "-"}
                      </td>
                      <td className="py-3 px-3 font-mono text-sm text-[#3D4442]">
                        {e.jam_keluar ?? "-"}
                      </td>
                      <td className="py-3 px-3 text-[#6B7770] max-w-[180px]">
                        <span className="line-clamp-2">
                          {e.keterangan ?? "-"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {e.bukti_url ? (
                          <button
                            onClick={() => openAuthenticatedFile(e.bukti_url!)}
                            className="inline-flex items-center gap-1 text-[#1B4332] font-semibold hover:underline"
                          >
                            <Eye size={13} /> Lihat
                          </button>
                        ) : (
                          <span className="text-[#6B7770]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status="disetujui" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "laporan" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <h3 className="font-bold text-[#1B4332] mb-4">Daftar Laporan</h3>
            {laporan.length === 0 ? (
              <EmptyState label="Belum ada laporan." />
            ) : (
              <div className="space-y-2">
                {laporan.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLaporan(l.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-colors",
                      selectedLaporan === l.id
                        ? "border-[#1B4332] bg-[#D1FAE5]"
                        : "border-[#1B4332]/10 bg-[#F1F3F1] hover:border-[#1B4332]/30",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-[#3D4442]">
                          {l.judul}
                        </p>
                        <p className="text-xs text-[#6B7770] mt-0.5">
                          {l.tanggal}
                        </p>
                      </div>
                      <StatusBadge status={l.status} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
          <Card>
            {currentLaporan ? (
              <div className="space-y-4">
                <h3 className="font-bold text-[#1B4332]">Detail Laporan</h3>
                <div className="p-3 rounded-xl bg-[#F1F3F1]">
                  <p className="font-bold text-sm text-[#1B4332]">
                    {currentLaporan.judul}
                  </p>
                  <p className="text-xs text-[#6B7770] mt-0.5">
                    {currentLaporan.tanggal}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#F1F3F1] text-sm text-[#3D4442] whitespace-pre-wrap">
                  {currentLaporan.isi}
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                    Feedback / Komentar
                  </label>
                  <textarea
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tulis feedback untuk peserta..."
                    className="w-full px-3 py-2 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={submittingLaporan !== null}
                    onClick={() => reviewLaporan("selesai")}
                    className="flex-1 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send size={13} />{" "}
                    {submittingLaporan === "selesai"
                      ? "Mengirim..."
                      : "Kirim Feedback"}
                  </button>
                  <button
                    disabled={submittingLaporan !== null}
                    onClick={() => reviewLaporan("perlu-revisi")}
                    className="px-4 py-2 border border-red-300 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {submittingLaporan === "perlu-revisi"
                      ? "Mengirim..."
                      : "Revisi"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <BookOpen size={32} className="text-[#6B7770]/40 mb-3" />
                <p className="text-sm text-[#6B7770]">
                  Pilih laporan untuk melihat detail
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "rekomendasi" && (
        <div className="space-y-4">
          {rekomendasi.length > 0 && (
            <Card>
              <h3 className="font-bold text-[#1B4332] mb-3">
                Riwayat Rekomendasi
              </h3>
              <div className="space-y-3">
                {rekomendasi.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-[#F1F3F1]">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#3D4442]">
                        {r.diberikan_oleh} — {r.tanggal}
                      </p>
                      <span className="text-sm font-bold text-[#1B4332]">
                        Rata-rata {r.rata_rata}/5
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs text-[#6B7770]">
                      <p>Kedisiplinan: {r.kedisiplinan}</p>
                      <p>Teknis: {r.teknis}</p>
                      <p>Sikap: {r.sikap}</p>
                      <p>Inisiatif: {r.inisiatif}</p>
                    </div>
                    {r.catatan && (
                      <p className="text-sm text-[#3D4442] mt-2 whitespace-pre-wrap">
                        {r.catatan}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h3 className="font-bold text-[#1B4332] mb-4">
              Beri Rekomendasi Baru
            </h3>
            <div className="space-y-3 mb-5">
              {Object.entries({
                kedisiplinan: "Kedisiplinan",
                teknis: "Kemampuan Teknis",
                sikap: "Sikap & Attitude",
                inisiatif: "Inisiatif",
              }).map(([key, label]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#3D4442]">
                      {label}
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setRating((r) => ({ ...r, [key]: n }))}
                          className={cn(
                            "w-6 h-6 rounded-full text-xs font-bold transition-colors",
                            n <= rating[key]
                              ? "bg-[#1B4332] text-white"
                              : "bg-[#F1F3F1] text-[#6B7770] hover:bg-[#D1FAE5]",
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <textarea
              rows={3}
              value={catatanRekomendasi}
              onChange={(e) => setCatatanRekomendasi(e.target.value)}
              placeholder="Catatan tambahan (opsional)..."
              className="w-full px-3 py-2 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 resize-none mb-4"
            />
            <button
              disabled={submittingRekomendasi}
              onClick={submitRekomendasi}
              className="flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-50"
            >
              <Send size={14} />{" "}
              {submittingRekomendasi ? "Mengirim..." : "Simpan Rekomendasi"}
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Presensi & Kegiatan ────────────────────────────────────────────────────
// Halaman induk gabungan navigasi untuk 3 fitur yang sudah ada:
// Monitoring Kehadiran, Riwayat Absensi, Review Laporan.
// PENTING: ini HANYA menggabungkan navigasi/tampilan (tab). Ketiga komponen
// (AdminMonitoring, AbsensiVerify, ReviewLaporan) dipakai ulang persis apa
// adanya — tidak diubah sama sekali — masing-masing tetap punya API,
// state, dan logikanya sendiri-sendiri.
type PresensiTab = "monitoring" | "absensi" | "laporan";

function PresensiKegiatan({
  initialTab,
  onSelectPeserta,
}: {
  initialTab: PresensiTab;
  onSelectPeserta: (id: number) => void;
}) {
  const [tab, setTab] = useState<PresensiTab>(initialTab);

  // Sinkron ulang tab aktif kalau halaman ini dibuka lewat rute lama
  // (mis. klik notifikasi "review-laporan") sementara komponen sudah terpasang.
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const tabs: { key: PresensiTab; label: string }[] = [
    { key: "monitoring", label: "Monitoring Kehadiran" },
    { key: "absensi", label: "Riwayat Absensi" },
    { key: "laporan", label: "Review Laporan" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#1B4332]">Presensi & Kegiatan</h1>

      <div className="flex gap-1.5 bg-[#EAF2ED] p-1.5 rounded-xl w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap",
              tab === t.key
                ? "bg-[#1B4332] text-white shadow-sm"
                : "text-[#2D5A45] hover:bg-[#1B4332]/10",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "monitoring" && <AdminMonitoring />}
      {tab === "absensi" && <AbsensiVerify onSelectPeserta={onSelectPeserta} />}
      {tab === "laporan" && <ReviewLaporan onSelectPeserta={onSelectPeserta} />}
    </div>
  );
}

function AbsensiVerify({
  onSelectPeserta,
}: {
  onSelectPeserta?: (id: number) => void;
}) {
  const [entries, setEntries] = useState<AbsensiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/absensi");
      setEntries(data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data absensi."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    "Peserta",
    "Tanggal",
    "Sift",
    "Masuk",
    "Keluar",
    "Keterangan",
    "Bukti",
    "Status",
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#1B4332]">Riwayat Absensi</h1>
      <Card>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : entries.length === 0 ? (
          <EmptyState label="Belum ada data absensi." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1B4332]/10">
                  {columns.map((h) => (
                    <th
                      key={h}
                      className="text-left py-2.5 px-3 text-[#6B7770] text-xs font-semibold uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-[#1B4332]/5 hover:bg-[#F1F3F1]/50 transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-[#1B4332]">
                      {onSelectPeserta ? (
                        <button
                          onClick={() => onSelectPeserta(e.peserta_magang_id)}
                          className="hover:underline"
                        >
                          {e.nama}
                        </button>
                      ) : (
                        e.nama
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#6B7770]">{e.tanggal}</td>
                    <td className="py-3 px-3 text-[#6B7770] capitalize">
                      {SIFT_OPTIONS.find((o) => o.value === e.sift)?.label ??
                        "-"}
                      {e.di_luar_jam && (
                        <span
                          title="Di luar jam yang ditentukan, tidak direkap"
                          className="ml-1 text-amber-600"
                        >
                          ⚠
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-sm text-[#3D4442]">
                      {e.jam_masuk ?? "-"}
                    </td>
                    <td className="py-3 px-3 font-mono text-sm text-[#3D4442]">
                      {e.jam_keluar ?? "-"}
                    </td>
                    <td className="py-3 px-3 text-[#6B7770] max-w-[200px]">
                      <span className="line-clamp-2">
                        {e.keterangan ?? "-"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {e.bukti_url ? (
                        <button
                          onClick={() => openAuthenticatedFile(e.bukti_url!)}
                          className="inline-flex items-center gap-1 text-[#1B4332] font-semibold hover:underline"
                        >
                          <Eye size={13} /> Lihat
                        </button>
                      ) : (
                        <span className="text-[#6B7770]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status="disetujui" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function ReviewLaporan({
  onSelectPeserta,
}: {
  onSelectPeserta: (id: number) => void;
}) {
  const [list, setList] = useState<LaporanItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState<
    "selesai" | "perlu-revisi" | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/laporan");
      setList(data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat laporan."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = list.find((x) => x.id === selected) ?? null;

  useEffect(() => {
    setFeedback(current?.catatan_pembimbing ?? "");
  }, [current?.id]);

  async function review(status: "selesai" | "perlu-revisi") {
    if (!current) return;
    setSubmitting(status);
    try {
      await api.put(`/laporan/${current.id}/review`, {
        status,
        catatan_pembimbing: feedback || undefined,
      });
      await load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal mengirim review."));
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#1B4332]">
        Review Laporan Peserta
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h3 className="font-bold text-[#1B4332] mb-4">Daftar Laporan</h3>
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : list.length === 0 ? (
            <EmptyState label="Belum ada laporan dari peserta." />
          ) : (
            <div className="space-y-2">
              {list.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelected(l.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-colors",
                    selected === l.id
                      ? "border-[#1B4332] bg-[#D1FAE5]"
                      : "border-[#1B4332]/10 bg-[#F1F3F1] hover:border-[#1B4332]/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-[#3D4442]">
                        {l.judul}
                      </p>
                      <p className="text-xs text-[#6B7770] mt-0.5">
                        <span
                          onClick={(ev) => {
                            ev.stopPropagation();
                            onSelectPeserta(l.peserta_magang_id);
                          }}
                          className="hover:underline"
                        >
                          {l.peserta}
                        </span>{" "}
                        — {l.tanggal}
                      </p>
                    </div>
                    <StatusBadge status={l.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          {current ? (
            <div className="space-y-4">
              <h3 className="font-bold text-[#1B4332]">Detail Laporan</h3>
              <div className="p-3 rounded-xl bg-[#F1F3F1]">
                <p className="font-bold text-sm text-[#1B4332]">
                  {current.judul}
                </p>
                <p className="text-xs text-[#6B7770] mt-0.5">
                  {current.peserta} — {current.tanggal}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F1F3F1] text-sm text-[#3D4442] whitespace-pre-wrap">
                {current.isi}
              </div>
              <div>
                <label className="text-sm font-semibold text-[#3D4442] block mb-1.5">
                  Feedback / Komentar
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tulis feedback untuk peserta..."
                  className="w-full px-3 py-2 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  disabled={submitting !== null}
                  onClick={() => review("selesai")}
                  className="flex-1 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={13} />{" "}
                  {submitting === "selesai" ? "Mengirim..." : "Kirim Feedback"}
                </button>
                <button
                  disabled={submitting !== null}
                  onClick={() => review("perlu-revisi")}
                  className="px-4 py-2 border border-red-300 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {submitting === "perlu-revisi" ? "Mengirim..." : "Revisi"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <BookOpen size={32} className="text-[#6B7770]/40 mb-3" />
              <p className="text-sm text-[#6B7770]">
                Pilih laporan untuk melihat detail
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Rekomendasi({
  onSelectPeserta,
}: {
  onSelectPeserta: (id: number) => void;
}) {
  const [list, setList] = useState<PesertaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ratings, setRatings] = useState<
    Record<number, Record<string, number>>
  >({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/peserta", {
        params: { status: "aktif" },
      });
      setList(data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data peserta."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function ratingFor(pesertaId: number) {
    return (
      ratings[pesertaId] ?? {
        kedisiplinan: 4,
        teknis: 4,
        sikap: 4,
        inisiatif: 4,
      }
    );
  }
  function setRating(pesertaId: number, key: string, value: number) {
    setRatings((r) => ({
      ...r,
      [pesertaId]: { ...ratingFor(pesertaId), [key]: value },
    }));
  }

  async function submitRekomendasi(p: PesertaItem) {
    setSubmittingId(p.id);
    try {
      await api.post(`/peserta/${p.id}/rekomendasi`, ratingFor(p.id));
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal mengirim rekomendasi."));
    } finally {
      setSubmittingId(null);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#1B4332]">
        Rekomendasi Kelulusan Magang
      </h1>

      {list.length === 0 ? (
        <EmptyState label="Tidak ada peserta magang yang aktif." />
      ) : (
        <div className="space-y-4">
          {list.map((p) => {
            const r = ratingFor(p.id);
            return (
              <Card key={p.id}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-[#1B4332] flex items-center justify-center text-white font-bold">
                    {p.nama.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <button
                      onClick={() => onSelectPeserta(p.id)}
                      className="font-bold text-[#1B4332] hover:underline"
                    >
                      {p.nama}
                    </button>
                    <p className="text-sm text-[#6B7770]">
                      Divisi {p.divisi} — Hari ke-{p.hari_berjalan}/
                      {p.total_hari}, Kehadiran {p.persen}%
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  {Object.entries({
                    kedisiplinan: "Kedisiplinan",
                    teknis: "Kemampuan Teknis",
                    sikap: "Sikap & Attitude",
                    inisiatif: "Inisiatif",
                  }).map(([key, label]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#3D4442]">
                          {label}
                        </span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() => setRating(p.id, key, n)}
                              className={cn(
                                "w-6 h-6 rounded-full text-xs font-bold transition-colors",
                                n <= r[key]
                                  ? "bg-[#1B4332] text-white"
                                  : "bg-[#F1F3F1] text-[#6B7770] hover:bg-[#D1FAE5]",
                              )}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  disabled={submittingId === p.id}
                  onClick={() => submitRekomendasi(p)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-50"
                >
                  <Send size={14} />{" "}
                  {submittingId === p.id ? "Mengirim..." : "Simpan Rekomendasi"}
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [role, setRole] = useState<Role>("admin");
  const [userName, setUserName] = useState("");
  const [page, setPage] = useState<Page>("dashboard");
  const [selectedPendaftaranId, setSelectedPendaftaranId] = useState<
    number | null
  >(null);
  const [selectedPesertaId, setSelectedPesertaId] = useState<number | null>(
    null,
  );

  function handleLogin(r: Role, name: string, token: string) {
    sessionStorage.setItem("simago_token", token);
    setRole(r);
    setUserName(name);
    setPage("dashboard");
    setLoggedIn(true);
  }

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("simago_token");
    setLoggedIn(false);
    setRole("admin");
    setPage("dashboard");
    setSelectedPendaftaranId(null);
  }, []);

  // Kalau token sudah tidak valid (401 dari API manapun), otomatis kembali ke halaman login.
  useEffect(() => {
    setOnUnauthorized(handleLogout);
  }, [handleLogout]);

  function doLogout() {
    api.post("/logout").catch(() => {}); // tetap logout di frontend walau request gagal
    handleLogout();
  }

  // Dipakai saat notifikasi diklik: kalau notifikasi bawa pendaftaran_id
  // (mis. "Calon Peserta Memperbarui Data Pendaftaran"), langsung pilih
  // pendaftaran itu supaya halaman Verifikasi Berkas tidak kosong.
  function handleNotifNavigate(page: Page, pendaftaranId?: number | null) {
    if (typeof pendaftaranId === "number") {
      setSelectedPendaftaranId(pendaftaranId);
    }
    setPage(page);
  }

  // Pulihkan sesi kalau token masih tersimpan (mis. setelah refresh halaman).
  useEffect(() => {
    const token = sessionStorage.getItem("simago_token");
    if (!token) {
      setCheckingSession(false);
      return;
    }

    api
      .get("/me")
      .then(({ data }) => {
        setRole(data.data.role as Role);
        setUserName(data.data.nama as string);
        setLoggedIn(true);
      })
      .catch(() => sessionStorage.removeItem("simago_token"))
      .finally(() => setCheckingSession(false));
  }, []);

  // Role akun "calon" bisa berubah jadi "peserta" di server (begitu admin
  // menyetujui pendaftarannya), tapi tab yang sedang terbuka tidak otomatis
  // tahu perubahan itu — role di state cuma diisi sekali saat login/refresh.
  // Supaya menu Peserta (Absensi, Laporan, dst.) muncul tanpa perlu logout
  // manual, cek ulang /me secara berkala dan setiap kali tab ini difokuskan.
  useEffect(() => {
    if (!loggedIn || role !== "calon") return;

    async function cekRoleTerbaru() {
      try {
        const { data } = await api.get("/me");
        if (data.data.role !== "calon") {
          setRole(data.data.role as Role);
          setPage("dashboard"); // sambutan awal di tampilan Peserta yang baru
        }
      } catch {
        // Diamkan saja — kalau token benar-benar tidak valid lagi,
        // interceptor global (onUnauthorized) yang akan menangani logout.
      }
    }

    const interval = setInterval(cekRoleTerbaru, 30000); // tiap 30 detik
    function onVisible() {
      if (document.visibilityState === "visible") cekRoleTerbaru();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", cekRoleTerbaru);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", cekRoleTerbaru);
    };
  }, [loggedIn, role]);

  if (checkingSession) return <LoadingState label="Memuat sesi..." />;
  if (!loggedIn) return <LoginPage onLogin={handleLogin} />;

  function renderPage() {
    // Admin pages
    if (role === "admin") {
      switch (page as AdminPage) {
        case "dashboard":
          return <AdminDashboard setPage={setPage} />;
        case "pendaftar":
          return (
            <AdminPendaftar
              selectedPendaftaranId={selectedPendaftaranId}
              onSelectPendaftaran={setSelectedPendaftaranId}
              setPage={setPage}
            />
          );
        case "verifikasi":
          return (
            <VerifikasiBerkasPage
              pendaftaranId={selectedPendaftaranId}
              onBack={() => {
                setSelectedPendaftaranId(null);
                setPage("pendaftar");
              }}
            />
          );
        case "divisi":
          return <AdminDivisi />;
        case "presensi":
        case "monitoring":
        case "absensi-riwayat":
        case "review-laporan": {
          const initialTab: PresensiTab =
            page === "absensi-riwayat"
              ? "absensi"
              : page === "review-laporan"
                ? "laporan"
                : "monitoring";
          return (
            <PresensiKegiatan
              initialTab={initialTab}
              onSelectPeserta={(id) => {
                setSelectedPesertaId(id);
                setPage("peserta-detail");
              }}
            />
          );
        }
        case "rekomendasi":
          return (
            <Rekomendasi
              onSelectPeserta={(id) => {
                setSelectedPesertaId(id);
                setPage("peserta-detail");
              }}
            />
          );
        case "peserta-detail":
          return selectedPesertaId ? (
            <DetailPeserta
              pesertaId={selectedPesertaId}
              onBack={() => setPage("dashboard")}
            />
          ) : (
            <AdminDashboard setPage={setPage} />
          );
        case "sertifikat":
          return <AdminSertifikat />;
        case "laporan":
          return <AdminLaporan />;
        case "pengumuman":
          return <AdminPengumuman onBack={() => setPage("dashboard")} />;
        case "profil":
          return <AdminProfil />;
      }
    }

    // Calon / Peserta pages
    if (role === "calon" || role === "peserta") {
      switch (page as PesertaPage) {
        case "dashboard":
          return <CalonDashboard userStatus={role} />;
        case "pendaftaran":
          return (
            <PendaftaranPage
              selectedPendaftaranId={selectedPendaftaranId}
              setSelectedPendaftaranId={setSelectedPendaftaranId}
            />
          );
        case "profil":
          return <PesertaProfil />;
        case "laporan-peserta":
          return <PesertaLaporan />;
        case "sertifikat-peserta":
          return <PesertaSertifikat />;
      }
    }

    return <div className="p-6 text-[#6B7770]">Halaman tidak ditemukan.</div>;
  }

  return (
    <Layout
      role={role}
      page={page}
      setPage={setPage}
      onLogout={doLogout}
      userName={userName}
      onNotifNavigate={handleNotifNavigate}
      resetSelection={() => setSelectedPendaftaranId(null)}
    >
      {renderPage()}
    </Layout>
  );
}

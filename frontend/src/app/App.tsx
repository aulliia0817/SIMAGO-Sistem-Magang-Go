import { useState, useEffect, useCallback, useRef } from "react";
import logoKabupatenMadiun from "../assets/logo-kabupaten-madiun.gif";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  ClipboardList,
  MapPin,
  UserCog,
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
import { api, apiErrorMessage, setOnUnauthorized } from "./lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "admin" | "calon" | "peserta" | "pembimbing";
type AdminPage =
  | "dashboard"
  | "pendaftar"
  | "verifikasi"
  | "seleksi"
  | "penempatan"
  | "pembimbing-akun"
  | "monitoring"
  | "sertifikat"
  | "laporan";
type CalonPage =
  | "dashboard"
  | "pendaftaran"
  | "dokumen"
  | "tracking"
  | "profil";
type PesertaPage =
  | CalonPage
  | "absensi"
  | "laporan-peserta"
  | "sertifikat-peserta";
type PembimbingPage =
  | "dashboard"
  | "absensi-verify"
  | "review-laporan"
  | "rekomendasi";
type Page = AdminPage | CalonPage | PesertaPage | PembimbingPage;

// ─── API Data Types ─────────────────────────────────────────────────────────
// Seluruh data di bawah ini sekarang datang dari Laravel API (bukan mock lagi).
// Bentuk (shape) tiap tipe mengikuti App\Http\Resources\* di backend.

type Divisi = { id: number; nama: string; kuota: number; sisa_kuota: number };
type PendaftarItem = {
  id: number;
  nama: string;
  institusi: string;
  jurusan: string;
  divisi: string;
  divisi_id: number;
  periode: string;
  motivasi: string | null;
  tanggal: string;
  status: string;
  catatan_admin: string | null;
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
type PembimbingItem = {
  id: number;
  nama: string;
  email: string;
  nip: string;
  divisi: string;
  divisi_id: number;
  peserta: number;
  status: string;
};
type PesertaItem = {
  id: number;
  nama: string;
  divisi: string;
  divisi_id: number;
  pembimbing: string;
  pembimbing_id: number | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
  hari_berjalan: number;
  total_hari: number;
  hadir: number;
  total_absensi: number;
  persen: number;
  status: string;
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

function StatusBadge({ status }: { status: string }) {
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
    perhatian: { label: "Perlu Perhatian", cls: "bg-amber-100 text-amber-800" },
    "belum-review": {
      label: "Belum Direview",
      cls: "bg-amber-100 text-amber-800",
    },
    ditolak: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
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
      {cfg.label}
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
        icon: <ClipboardList size={18} />,
        label: "Proses Seleksi",
        page: "seleksi",
      },
      {
        icon: <MapPin size={18} />,
        label: "Penempatan Peserta",
        page: "penempatan",
      },
      {
        icon: <UserCog size={18} />,
        label: "Manajemen Pembimbing",
        page: "pembimbing-akun",
      },
      {
        icon: <BarChart3 size={18} />,
        label: "Monitoring Kehadiran",
        page: "monitoring",
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
  if (role === "pembimbing") {
    return [
      {
        icon: <LayoutDashboard size={18} />,
        label: "Dashboard",
        page: "dashboard",
      },
      {
        icon: <Fingerprint size={18} />,
        label: "Verifikasi Absensi",
        page: "absensi-verify",
      },
      {
        icon: <BookOpen size={18} />,
        label: "Review Laporan",
        page: "review-laporan",
      },
      {
        icon: <Star size={18} />,
        label: "Rekomendasi Kelulusan",
        page: "rekomendasi",
      },
    ];
  }
  // calon / peserta
  const base: NavItem[] = [
    { icon: <Home size={18} />, label: "Dashboard", page: "dashboard" },
    {
      icon: <ClipboardList size={18} />,
      label: "Pendaftaran",
      page: "pendaftaran",
    },
    { icon: <Upload size={18} />, label: "Upload Dokumen", page: "dokumen" },
    {
      icon: <BarChart3 size={18} />,
      label: "Tracking Status",
      page: "tracking",
    },
    { icon: <UserCircle size={18} />, label: "Profil", page: "profil" },
  ];
  if (role === "peserta") {
    return [
      ...base,
      { icon: <Fingerprint size={18} />, label: "Absensi", page: "absensi" },
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
}: {
  role: Role;
  page: Page;
  setPage: (p: Page) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  onLogout: () => void;
}) {
  const items = getNavItems(role);
  const roleLabel: Record<Role, string> = {
    admin: "Administrator",
    calon: "Calon Magang",
    peserta: "Peserta Magang",
    pembimbing: "Pembimbing Lapangan",
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
                setPage(item.page);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                !open && "justify-center px-0",
                page === item.page
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

function TopBar({
  role,
  userName,
}: {
  role: Role;
  userName: string;
}) {
  return (
    <header className="h-14 shrink-0 bg-white border-b border-[#1B4332]/10 flex items-center px-4 gap-4">
      <div className="flex-1" />
      <button className="relative text-[#6B7770] hover:text-[#1B4332] transition-colors">
        <Bell size={20} />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#1B4332] rounded-full text-[9px] text-white flex items-center justify-center font-bold">
          3
        </span>
      </button>
      <div className="flex items-center gap-2 pl-3 border-l border-[#1B4332]/10">
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
  children,
}: {
  role: Role;
  page: Page;
  setPage: (p: Page) => void;
  onLogout: () => void;
  userName: string;
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
      />
      <div className="ml-20 flex flex-col h-screen">
        <TopBar
          role={role}
          userName={userName}
        />
        <main className="flex-1 min-h-0 p-5 lg:p-6 overflow-y-auto">{children}</main>
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
  pembimbing: {
    email: "pembimbing@simago.id",
    password: "pembimbing123",
    name: "Ir. Hendra Wijaya",
  },
  calon: {
    email: "calon@simago.id",
    password: "calon123",
    name: "Dewi Rahayu",
  },
  peserta: {
    email: "peserta@simago.id",
    password: "peserta123",
    name: "Rian Pratama",
  },
};

const ROLE_TABS: { key: Role; label: string }[] = [
  { key: "admin", label: "Admin" },
  { key: "pembimbing", label: "Pembimbing" },
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
                  Akun Pembimbing dan Admin dibuat oleh administrator, bukan
                  lewat pendaftaran mandiri.
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

function AdminDashboard() {
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
          <p className="text-sm text-[#6B7770]">
            Periode Magang: Juli — September 2025
          </p>
        </div>
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
          icon={<Briefcase size={18} className="text-[#2D5A45]" />}
          label="Pembimbing Aktif"
          value={stats?.jumlah_pembimbing ?? 0}
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

function AdminPendaftar({
  setPage,
  onSelectPendaftaran,
}: {
  setPage: (p: Page) => void;
  onSelectPendaftaran: (id: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filtered, setFiltered] = useState<PendaftarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/pendaftar", {
        params: { search, status: filterStatus, per_page: 50 },
      });
      setFiltered(data.data);
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

  async function handleVerify(
    p: PendaftarItem,
    status: "disetujui" | "ditolak",
  ) {
    setBusyId(p.id);
    try {
      if (status === "disetujui") {
        await api.put(`/pendaftar/${p.id}`, {
          status,
          pembimbing_id: null, // biarkan backend auto-assign pembimbing dari divisi yang sama
        });
      } else {
        await api.put(`/pendaftar/${p.id}`, { status });
      }
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal memperbarui status pendaftar."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-[#1B4332]">
          Manajemen Data Pendaftar
        </h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors">
          <Download size={15} /> Export
        </button>
      </div>

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
                    "#",
                    "Nama",
                    "Institusi",
                    "Jurusan",
                    "Divisi",
                    "Tgl Daftar",
                    "Status",
                    "Verifikasi Berkas",
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
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#1B4332]/5 hover:bg-[#F1F3F1]/50 transition-colors"
                  >
                    <td className="py-3 px-3 text-[#6B7770]">{p.id}</td>
                    <td className="py-3 px-3 font-semibold text-[#1B4332]">
                      {p.nama}
                    </td>
                    <td className="py-3 px-3 text-[#6B7770]">{p.institusi}</td>
                    <td className="py-3 px-3 text-[#6B7770]">{p.jurusan}</td>
                    <td className="py-3 px-3 text-[#6B7770]">{p.divisi}</td>
                    <td className="py-3 px-3 text-[#6B7770]">{p.tanggal}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            onSelectPendaftaran(p.id);
                            setPage("verifikasi");
                          }}
                          className="p-1.5 rounded-lg hover:bg-[#D1FAE5] text-[#1B4332] transition-colors"
                          title="Lihat detail"
                        >
                          <Eye size={14} />
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

function AdminVerifikasi({ pendaftaranId }: { pendaftaranId: number | null }) {
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
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal memperbarui status dokumen."));
    } finally {
      setBusyDoc(null);
    }
  }

  if (!pendaftaranId) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-[#1B4332]">Verifikasi Berkas</h1>
        <Card>
          <EmptyState label='Pilih pendaftar dari halaman "Data Pendaftar" (ikon mata) untuk memverifikasi berkasnya.' />
        </Card>
      </div>
    );
  }
  if (loading) return <LoadingState />;
  if (error || !p)
    return (
      <ErrorState message={error || "Data tidak ditemukan."} onRetry={load} />
    );

  const docs = p.dokumen ?? [];
  const verified = docs.filter((d) => d.status === "terverifikasi").length;
  const pct = docs.length ? Math.round((verified / docs.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#1B4332]">
        Verifikasi Berkas — {p.nama}
      </h1>

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
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-[#D1FAE5] text-[#1B4332] transition-colors"
                      >
                        <Eye size={13} />
                      </a>
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

function AdminSeleksi() {
  const [selected, setSelected] = useState<number[]>([]);
  const [list, setList] = useState<PendaftarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const toggleSelect = (id: number) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/pendaftar", {
        params: { per_page: 50 },
      });
      setList(data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data pendaftar."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function bulkUpdate(status: "disetujui" | "ditolak") {
    setBusy(true);
    try {
      await Promise.all(
        selected.map((id) => api.put(`/pendaftar/${id}`, { status })),
      );
      setSelected([]);
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal memproses seleksi."));
    } finally {
      setBusy(false);
    }
  }

  async function rowUpdate(id: number, status: "disetujui" | "ditolak") {
    setBusy(true);
    try {
      await api.put(`/pendaftar/${id}`, { status });
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal memproses seleksi."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-[#1B4332]">Proses Seleksi</h1>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <>
              <button
                disabled={busy}
                onClick={() => bulkUpdate("disetujui")}
                className="flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-50"
              >
                <Check size={15} /> Loloskan ({selected.length})
              </button>
              <button
                disabled={busy}
                onClick={() => bulkUpdate("ditolak")}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <XCircle size={15} /> Tolak ({selected.length})
              </button>
            </>
          )}
        </div>
      </div>

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
                  <th className="py-2.5 px-3 w-10">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setSelected(
                          e.target.checked ? list.map((p) => p.id) : [],
                        )
                      }
                      className="accent-[#1B4332]"
                    />
                  </th>
                  {[
                    "Nama",
                    "Institusi",
                    "Divisi",
                    "Kelengkapan Berkas",
                    "Status",
                    "Aksi",
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
                  const total = p.dokumen?.length ?? 0;
                  const done =
                    p.dokumen?.filter((d) => d.status === "terverifikasi")
                      .length ?? 0;
                  const pct = total
                    ? Math.round((done / total) * 100)
                    : p.status === "disetujui"
                      ? 100
                      : p.status === "ditolak"
                        ? 0
                        : 50;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-[#1B4332]/5 hover:bg-[#F1F3F1]/50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="accent-[#1B4332]"
                        />
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#1B4332]">
                        {p.nama}
                      </td>
                      <td className="py-3 px-3 text-[#6B7770]">
                        {p.institusi}
                      </td>
                      <td className="py-3 px-3 text-[#6B7770]">{p.divisi}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[#F1F3F1]">
                            <div
                              className="h-1.5 rounded-full bg-[#1B4332]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#6B7770]">{pct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1">
                          <button
                            disabled={busy}
                            onClick={() => rowUpdate(p.id, "disetujui")}
                            className="px-2.5 py-1 rounded-lg bg-[#D1FAE5] text-[#1B4332] text-xs font-semibold hover:bg-[#A8C3AD] transition-colors disabled:opacity-50"
                          >
                            Loloskan
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => rowUpdate(p.id, "ditolak")}
                            className="px-2.5 py-1 rounded-lg bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            Tolak
                          </button>
                        </div>
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

function AdminPenempatan() {
  const [divisions, setDivisions] = useState<Divisi[]>([]);
  const [peserta, setPeserta] = useState<PesertaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [div, ps] = await Promise.all([
        api.get("/divisi"),
        api.get("/peserta", { params: { status: "aktif" } }),
      ]);
      setDivisions(div.data.data);
      setPeserta(ps.data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data penempatan."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function assignDivisi(pesertaId: number, divisiId: number) {
    setSavingId(pesertaId);
    try {
      await api.put(`/peserta/${pesertaId}`, { divisi_id: divisiId });
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal menyimpan penempatan."));
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#1B4332]">Penempatan Peserta</h1>

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

      <Card>
        <h3 className="font-bold text-[#1B4332] mb-4">
          Assign Peserta ke Divisi
        </h3>
        {peserta.length === 0 ? (
          <EmptyState label="Belum ada peserta magang aktif." />
        ) : (
          <div className="space-y-3">
            {peserta.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-[#F1F3F1]"
              >
                <div className="w-8 h-8 rounded-full bg-[#1B4332] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {p.nama.charAt(0)}
                </div>
                <span className="flex-1 font-medium text-[#3D4442] text-sm">
                  {p.nama}
                </span>
                <select
                  value={p.divisi_id}
                  disabled={savingId === p.id}
                  onChange={(e) => assignDivisi(p.id, Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg border border-[#1B4332]/15 bg-white text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                >
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AdminPembimbing() {
  const [list, setList] = useState<PembimbingItem[]>([]);
  const [divisi, setDivisi] = useState<Divisi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PembimbingItem | null>(null);
  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    nip: "",
    divisi_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pb, div] = await Promise.all([
        api.get("/pembimbing"),
        api.get("/divisi"),
      ]);
      setList(pb.data.data);
      setDivisi(div.data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data pembimbing."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({
      nama: "",
      email: "",
      password: "",
      nip: "",
      divisi_id: divisi[0]?.id.toString() ?? "",
    });
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(p: PembimbingItem) {
    setEditing(p);
    setForm({
      nama: p.nama,
      email: p.email,
      password: "",
      nip: p.nip,
      divisi_id: p.divisi_id.toString(),
    });
    setFormError("");
    setFormOpen(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await api.put(`/pembimbing/${editing.id}`, {
          nama: form.nama,
          email: form.email,
          nip: form.nip,
          divisi_id: Number(form.divisi_id),
        });
      } else {
        await api.post("/pembimbing", {
          nama: form.nama,
          email: form.email,
          password: form.password,
          nip: form.nip,
          divisi_id: Number(form.divisi_id),
        });
      }
      setFormOpen(false);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, "Gagal menyimpan data pembimbing."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: PembimbingItem) {
    if (!confirm(`Hapus akun pembimbing ${p.nama}?`)) return;
    try {
      await api.delete(`/pembimbing/${p.id}`);
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal menghapus pembimbing."));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-[#1B4332]">
          Manajemen Pembimbing Lapangan
        </h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors"
        >
          <Plus size={15} /> Tambah Pembimbing
        </button>
      </div>

      {formOpen && (
        <Card>
          <h3 className="font-bold text-[#1B4332] mb-3">
            {editing ? "Edit Pembimbing" : "Tambah Pembimbing"}
          </h3>
          <form
            onSubmit={submitForm}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <input
              required
              value={form.nama}
              onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
              placeholder="Nama Lengkap"
              className="px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
            />
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="Email"
              className="px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
            />
            {!editing && (
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="Kata Sandi Awal"
                className="px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
              />
            )}
            <input
              required
              value={form.nip}
              onChange={(e) => setForm((f) => ({ ...f, nip: e.target.value }))}
              placeholder="NIP"
              className="px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
            />
            <select
              required
              value={form.divisi_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, divisi_id: e.target.value }))
              }
              className="px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none"
            >
              <option value="">Pilih Divisi</option>
              {divisi.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama}
                </option>
              ))}
            </select>
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
                  {[
                    "Nama",
                    "NIP",
                    "Divisi",
                    "Peserta Aktif",
                    "Status",
                    "Aksi",
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
                {list.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#1B4332]/5 hover:bg-[#F1F3F1]/50 transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-[#1B4332]">
                      {p.nama}
                    </td>
                    <td className="py-3 px-3 text-[#6B7770] font-mono text-xs">
                      {p.nip}
                    </td>
                    <td className="py-3 px-3 text-[#6B7770]">{p.divisi}</td>
                    <td className="py-3 px-3 font-bold text-[#1B4332]">
                      {p.peserta}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg hover:bg-[#D1FAE5] text-[#1B4332] transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
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

function AdminMonitoring() {
  const [divisi, setDivisi] = useState<Divisi[]>([]);
  const [divisiId, setDivisiId] = useState("semua");
  const [list, setList] = useState<PesertaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
                    "% Kehadiran",
                    "Progres",
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/peserta", {
        params: { status: "selesai" },
      });
      setCandidates(data.data);
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
    setBusyId(p.id);
    try {
      const nomor = `SIMAGO/${new Date().getFullYear()}/${p.id.toString().padStart(4, "0")}`;
      const { data } = await api.post("/sertifikat", {
        peserta_magang_id: p.id,
        nomor,
      });
      await api.put(`/sertifikat/${data.data.id}`, { status: "terbit" });
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

      <Card>
        <h3 className="font-bold text-[#1B4332] mb-4">Template Sertifikat</h3>
        <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-[#1B4332]/20 bg-[#F1F3F1]">
          <div className="w-12 h-12 rounded-xl bg-[#1B4332] flex items-center justify-center text-white">
            <Award size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#3D4442]">
              Template_Sertifikat_SIMAGO_2025.docx
            </p>
            <p className="text-xs text-[#6B7770]">
              Terakhir diperbarui: 1 Juli 2025
            </p>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#1B4332] text-white text-xs font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors">
            <Upload size={13} /> Perbarui
          </button>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-[#1B4332] mb-4">
          Peserta Siap Terima Sertifikat
        </h3>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : candidates.length === 0 ? (
          <EmptyState label="Belum ada peserta yang menyelesaikan magang." />
        ) : (
          <div className="space-y-3">
            {candidates.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-[#F1F3F1]"
              >
                <div className="w-9 h-9 rounded-full bg-[#1B4332] flex items-center justify-center text-white text-sm font-bold">
                  {p.nama.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#3D4442] text-sm">
                    {p.nama}
                  </p>
                  <p className="text-xs text-[#6B7770]">
                    {p.divisi} — Pembimbing: {p.pembimbing}
                  </p>
                </div>
                <button
                  disabled={busyId === p.id}
                  onClick={() => terbitkan(p)}
                  className="px-3 py-1.5 bg-[#1B4332] text-white text-xs font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-50"
                >
                  {busyId === p.id ? "Memproses..." : "Approve & Terbitkan"}
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
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

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dash, disetujui, selesai, terbit] = await Promise.all([
        api.get("/dashboard"),
        api.get("/pendaftar", {
          params: { status: "disetujui", per_page: 50 },
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
                className="w-full px-3 py-2 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                defaultValue="2025-07-01"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#6B7770] uppercase tracking-wide block mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
                defaultValue="2025-09-30"
              />
            </div>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors">
                <Download size={14} /> Excel
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-[#1B4332]/20 text-[#1B4332] text-sm font-semibold rounded-lg hover:bg-[#D1FAE5] transition-colors">
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

function CalonDashboard({ userStatus }: { userStatus: "calon" | "peserta" }) {
  const isPeserta = userStatus === "peserta";
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/dashboard");
      setD(data);
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
    </div>
  );
}

function FormPendaftaran({ setPage }: { setPage: (p: Page) => void }) {
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
    periode: "Juli — September 2025",
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
      await api.post("/pendaftaran", {
        ...form,
        divisi_id: Number(form.divisi_id),
      });
      setPage("tracking");
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
                Periode Magang
              </label>
              <select
                value={form.periode}
                onChange={set("periode")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none"
              >
                <option>Juli — September 2025</option>
                <option>Oktober — Desember 2025</option>
              </select>
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
                  ["Periode", form.periode],
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
            disabled={submitting || (step === 3 && !form.divisi_id)}
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

function UploadDokumen() {
  const [docs, setDocs] = useState<DokumenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingDocId = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/dokumen/saya");
      setDocs(data.data);
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
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal mengunggah dokumen."));
    } finally {
      setUploadingId(null);
    }
  }

  const verified = docs.filter((d) => d.status === "terverifikasi").length;
  const pct = docs.length ? Math.round((verified / docs.length) * 100) : 0;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-[#1B4332]">Upload Dokumen</h1>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChosen}
      />

      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#3D4442]">
            Total Kelengkapan: {verified} dari {docs.length} dokumen
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
            {docs.map((doc) => (
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
                    {(doc.status === "belum-upload" ||
                      doc.status === "ditolak") && (
                      <button
                        disabled={uploadingId === doc.id}
                        onClick={() => triggerUpload(doc.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1B4332] text-white text-xs font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-50"
                      >
                        <Upload size={12} />{" "}
                        {uploadingId === doc.id ? "Mengunggah..." : "Upload"}
                      </button>
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

function TrackingStatus() {
  const [p, setP] = useState<PendaftarItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/pendaftaran/saya");
      setP(data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat status pendaftaran."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!p)
    return (
      <div className="max-w-xl mx-auto">
        <EmptyState label="Belum ada pendaftaran. Silakan isi form pendaftaran terlebih dahulu." />
      </div>
    );

  const docCount = p.dokumen?.length ?? 0;
  const docVerified =
    p.dokumen?.every((d) => d.status === "terverifikasi") ?? false;
  const seleksiSelesai = p.status === "disetujui" || p.status === "ditolak";

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
      active: !docVerified,
      date: docVerified ? "Selesai" : "Sedang berjalan",
    },
    {
      label: "Proses Seleksi",
      desc: "Menunggu keputusan seleksi",
      done: seleksiSelesai,
      active: docVerified && !seleksiSelesai,
      date: seleksiSelesai ? "Selesai" : "Menunggu",
    },
    {
      label: "Pengumuman Hasil",
      desc:
        p.status === "disetujui"
          ? "Selamat, kamu lolos seleksi!"
          : p.status === "ditolak"
            ? "Belum lolos seleksi kali ini."
            : "Lolos / tidak lolos seleksi",
      done: seleksiSelesai,
      date: seleksiSelesai ? p.status : "Menunggu",
    },
  ];

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-[#1B4332]">
        Tracking Status Pendaftaran
      </h1>

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
              <div className={cn("pb-6", i === steps.length - 1 && "pb-0")}>
                <p
                  className={cn(
                    "font-bold text-sm",
                    s.done || s.active ? "text-[#1B4332]" : "text-[#6B7770]",
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
              <strong className="text-[#3D4442]">25 Juli 2025</strong>
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
  );
}

function PesertaAbsensi() {
  const [entries, setEntries] = useState<AbsensiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/absensi/saya");
      setEntries(data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat riwayat absensi."));
    } finally {
      setLoading(false);
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
  const alreadyCheckedInToday = entries.some(
    (e) => e.tanggal === todayBackendFormat,
  );

  async function checkIn() {
    setCheckingIn(true);
    try {
      const now = new Date();
      const jam = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      await api.post("/absensi", { status: "hadir", jam_masuk: jam });
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal melakukan check-in."));
    } finally {
      setCheckingIn(false);
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
      <h1 className="text-xl font-bold text-[#1B4332]">Absensi</h1>

      <Card className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#D1FAE5] flex items-center justify-center text-[#1B4332]">
          <Fingerprint size={22} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-[#1B4332]">Check In Hari Ini</p>
          <p className="text-sm text-[#6B7770]">
            {todayLabel} —{" "}
            {alreadyCheckedInToday ? "Sudah check-in" : "Belum check-in"}
          </p>
        </div>
        <button
          disabled={checkingIn || alreadyCheckedInToday}
          onClick={checkIn}
          className="px-5 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors disabled:opacity-50"
        >
          {alreadyCheckedInToday
            ? "Sudah Check In"
            : checkingIn
              ? "Memproses..."
              : "Check In Sekarang"}
        </button>
      </Card>

      <Card>
        <h3 className="font-bold text-[#1B4332] mb-4">Riwayat Absensi</h3>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : entries.length === 0 ? (
          <EmptyState label="Belum ada riwayat absensi." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1B4332]/10">
                  {["Tanggal", "Check In", "Check Out", "Status"].map((h) => (
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
                    <td className="py-3 px-3 font-medium text-[#3D4442]">
                      {e.tanggal}
                    </td>
                    <td className="py-3 px-3 font-mono text-sm text-[#3D4442]">
                      {e.jam_masuk ?? "-"}
                    </td>
                    <td className="py-3 px-3 font-mono text-sm text-[#3D4442]">
                      {e.jam_keluar ?? "-"}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge
                        status={e.diverifikasi ? "disetujui" : "menunggu"}
                      />
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
          <a
            href={s.file_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-lg hover:bg-[#2D5A45] transition-colors"
          >
            <Download size={14} /> Unduh Sertifikat
          </a>
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
                ["Pembimbing", peserta.pembimbing],
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
  const [noHp, setNoHp] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/profil");
      setProfil(data);
      setNoHp(data.mahasiswa?.no_hp ?? "");
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
    try {
      await api.put("/profil", { no_hp: noHp });
      setEditing(false);
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal menyimpan profil."));
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
          ["Pembimbing", peserta.pembimbing],
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
                No. HP (WhatsApp)
              </label>
              <input
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1B4332]/15 bg-[#F1F3F1] text-sm text-[#3D4442] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
              />
            </div>
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

// ─── Pembimbing Pages ─────────────────────────────────────────────────────────

function PembimbingDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [list, setList] = useState<PesertaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dash, ps] = await Promise.all([
        api.get("/dashboard"),
        api.get("/peserta", { params: { status: "aktif" } }),
      ]);
      setStats(dash.data);
      setList(ps.data.data);
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

  const rataKehadiran = list.length
    ? Math.round(list.reduce((sum, p) => sum + p.persen, 0) / list.length)
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#1B4332]">
          Dashboard Pembimbing
        </h1>
        <p className="text-sm text-[#6B7770]">
          Peserta bimbingan Anda saat ini
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard
          icon={<Users size={18} className="text-[#1B4332]" />}
          label="Peserta Aktif"
          value={list.length}
          color="bg-[#D1FAE5]"
        />
        <SummaryCard
          icon={<BarChart3 size={18} className="text-[#1B4332]" />}
          label="Rata-rata Kehadiran"
          value={`${rataKehadiran}%`}
          color="bg-[#D1FAE5]"
        />
        <SummaryCard
          icon={<BookOpen size={18} className="text-amber-700" />}
          label="Laporan Perlu Review"
          value={stats?.laporan_perlu_review ?? 0}
          color="bg-amber-100"
        />
      </div>

      <Card>
        <h3 className="font-bold text-[#1B4332] mb-4">
          Daftar Peserta Bimbingan
        </h3>
        {list.length === 0 ? (
          <EmptyState label="Belum ada peserta bimbingan." />
        ) : (
          <div className="space-y-3">
            {list.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-[#F1F3F1]"
              >
                <div className="w-9 h-9 rounded-full bg-[#1B4332] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {p.nama.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#3D4442] text-sm">
                    {p.nama}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-[#D1FAE5]">
                      <div
                        className="h-1.5 rounded-full bg-[#1B4332]"
                        style={{ width: `${p.persen}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#6B7770]">{p.persen}%</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-[#6B7770]">
                    Sisa {Math.max(0, p.total_hari - p.hari_berjalan)} hari
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AbsensiVerify() {
  const [entries, setEntries] = useState<AbsensiItem[]>([]);
  const [onlyPending, setOnlyPending] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/absensi", {
        params: onlyPending ? { belum_verifikasi: 1 } : {},
      });
      setEntries(data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat data absensi."));
    } finally {
      setLoading(false);
    }
  }, [onlyPending]);

  useEffect(() => {
    load();
  }, [load]);

  async function verify(id: number) {
    setBusyId(id);
    try {
      await api.put(`/absensi/${id}/verifikasi`);
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Gagal memverifikasi absensi."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#1B4332]">Verifikasi Absensi</h1>
      <div className="flex gap-3 flex-wrap">
        <select
          value={onlyPending ? "menunggu" : "semua"}
          onChange={(e) => setOnlyPending(e.target.value === "menunggu")}
          className="px-3 py-2 rounded-lg border border-[#1B4332]/15 bg-white text-sm text-[#3D4442] focus:outline-none"
        >
          <option value="menunggu">Menunggu Verifikasi</option>
          <option value="semua">Semua Absensi</option>
        </select>
      </div>
      <Card>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : entries.length === 0 ? (
          <EmptyState label="Tidak ada absensi yang perlu diverifikasi." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1B4332]/10">
                  {[
                    "Peserta",
                    "Tanggal",
                    "Masuk",
                    "Keluar",
                    "Status",
                    "Aksi",
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
                {entries.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-[#1B4332]/5 hover:bg-[#F1F3F1]/50 transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-[#1B4332]">
                      {e.nama}
                    </td>
                    <td className="py-3 px-3 text-[#6B7770]">{e.tanggal}</td>
                    <td className="py-3 px-3 font-mono text-sm text-[#3D4442]">
                      {e.jam_masuk ?? "-"}
                    </td>
                    <td className="py-3 px-3 font-mono text-sm text-[#3D4442]">
                      {e.jam_keluar ?? "-"}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge
                        status={e.diverifikasi ? "disetujui" : "menunggu"}
                      />
                    </td>
                    <td className="py-3 px-3">
                      {!e.diverifikasi && (
                        <div className="flex gap-1">
                          <button
                            disabled={busyId === e.id}
                            onClick={() => verify(e.id)}
                            className="p-1.5 rounded-lg bg-[#D1FAE5] text-[#1B4332] hover:bg-[#A8C3AD] transition-colors disabled:opacity-50"
                            title="Verifikasi"
                          >
                            <Check size={13} />
                          </button>
                        </div>
                      )}
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

function ReviewLaporan() {
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
            <EmptyState label="Belum ada laporan dari peserta bimbingan." />
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
                        {l.peserta} — {l.tanggal}
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

function Rekomendasi() {
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
      setError(apiErrorMessage(err, "Gagal memuat data peserta bimbingan."));
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
      // Backend menandai peserta sebagai "selesai" — admin lalu bisa menerbitkan
      // sertifikat dari halaman Kelola Sertifikat berdasarkan rekomendasi ini.
      await api.put(`/peserta/${p.id}`, { status: "selesai" });
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
        <EmptyState label="Tidak ada peserta bimbingan yang aktif." />
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
                    <p className="font-bold text-[#1B4332]">{p.nama}</p>
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
                  {submittingId === p.id
                    ? "Mengirim..."
                    : "Submit Rekomendasi ke Admin"}
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

  function handleLogin(r: Role, name: string, token: string) {
    localStorage.setItem("simago_token", token);
    setRole(r);
    setUserName(name);
    setPage("dashboard");
    setLoggedIn(true);
  }

  const handleLogout = useCallback(() => {
    localStorage.removeItem("simago_token");
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

  // Pulihkan sesi kalau token masih tersimpan (mis. setelah refresh halaman).
  useEffect(() => {
    const token = localStorage.getItem("simago_token");
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
      .catch(() => localStorage.removeItem("simago_token"))
      .finally(() => setCheckingSession(false));
  }, []);

  if (checkingSession) return <LoadingState label="Memuat sesi..." />;
  if (!loggedIn) return <LoginPage onLogin={handleLogin} />;

  function renderPage() {
    // Admin pages
    if (role === "admin") {
      switch (page as AdminPage) {
        case "dashboard":
          return <AdminDashboard />;
        case "pendaftar":
          return (
            <AdminPendaftar
              setPage={setPage}
              onSelectPendaftaran={setSelectedPendaftaranId}
            />
          );
        case "verifikasi":
          return <AdminVerifikasi pendaftaranId={selectedPendaftaranId} />;
        case "seleksi":
          return <AdminSeleksi />;
        case "penempatan":
          return <AdminPenempatan />;
        case "pembimbing-akun":
          return <AdminPembimbing />;
        case "monitoring":
          return <AdminMonitoring />;
        case "sertifikat":
          return <AdminSertifikat />;
        case "laporan":
          return <AdminLaporan />;
      }
    }

    // Pembimbing pages
    if (role === "pembimbing") {
      switch (page as PembimbingPage) {
        case "dashboard":
          return <PembimbingDashboard />;
        case "absensi-verify":
          return <AbsensiVerify />;
        case "review-laporan":
          return <ReviewLaporan />;
        case "rekomendasi":
          return <Rekomendasi />;
      }
    }

    // Calon / Peserta pages
    if (role === "calon" || role === "peserta") {
      switch (page as PesertaPage) {
        case "dashboard":
          return <CalonDashboard userStatus={role} />;
        case "pendaftaran":
          return <FormPendaftaran setPage={setPage} />;
        case "dokumen":
          return <UploadDokumen />;
        case "tracking":
          return <TrackingStatus />;
        case "profil":
          return <PesertaProfil />;
        case "absensi":
          return <PesertaAbsensi />;
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
    >
      {renderPage()}
    </Layout>
  );
}

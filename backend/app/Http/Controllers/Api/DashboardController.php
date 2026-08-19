<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Dokumen;
use App\Models\LaporanHarian;
use App\Models\Pendaftaran;
use App\Models\PesertaMagang;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return match ($user->role) {
            'admin' => $this->admin(),
            'peserta' => $this->peserta($user),
            default => $this->calon($user),
        };
    }

    protected function admin()
    {
        $trend = Pendaftaran::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as bulan, COUNT(*) as pendaftar")
            ->where('created_at', '>=', now()->subMonths(8))
            ->groupBy('bulan')->orderBy('bulan')->get();

        return response()->json([
            'jumlah_pendaftar' => Pendaftaran::count(),
            'jumlah_peserta' => PesertaMagang::where('status', 'aktif')->count(),
            'jumlah_laporan' => LaporanHarian::count(),
            'jumlah_divisi' => \App\Models\Divisi::count(),
            'menunggu_verifikasi' => Pendaftaran::where('status', 'menunggu')->count(),
            'laporan_perlu_review' => LaporanHarian::where('status', 'belum-review')->count(),
            'persentase_kehadiran' => $this->persentaseKehadiranKeseluruhan(),
            'trend_pendaftar' => $trend,
        ]);
    }


    protected function calon($user)
    {
        $mahasiswa = $user->mahasiswa;
        $pendaftaran = $mahasiswa?->pendaftarans()->latest()->first();
        $dokumenCount = $pendaftaran ? $pendaftaran->dokumens()->count() : 0;

        return response()->json([
            'status_pendaftaran' => $pendaftaran?->status ?? 'belum-daftar',
            'dokumen_terverifikasi' => $pendaftaran ? $pendaftaran->dokumens()->where('status', 'terverifikasi')->count() : 0,
            'dokumen_menunggu' => $pendaftaran ? $pendaftaran->dokumens()->where('status', 'menunggu')->count() : 0,
            'dokumen_revisi' => $pendaftaran ? $pendaftaran->dokumens()->where('status', 'ditolak')->count() : 0,
            'dokumen_total' => $dokumenCount,
        ]);
    }

    protected function peserta($user)
    {
        $mahasiswa = $user->mahasiswa;
        $peserta = $mahasiswa?->pesertaMagang;

        if (!$peserta) {
            return $this->calon($user);
        }

        $totalHari = $peserta->tanggal_mulai && $peserta->tanggal_selesai
            ? $peserta->tanggal_mulai->diffInWeekdays($peserta->tanggal_selesai)
            : 0;

        // Sama seperti PesertaMagangResource: diffInWeekdays() itu jarak
        // MUTLAK, jadi periode yang belum mulai bisa kehitung "sudah jalan"
        // kalau dipakai langsung. Dicek dulu posisi hari ini relatif
        // terhadap periode sebelum dihitung jaraknya.
        $hariBerjalan = 0;
        if ($peserta->tanggal_mulai && $peserta->tanggal_selesai) {
            if (now()->lt($peserta->tanggal_mulai)) {
                $hariBerjalan = 0;
            } elseif (now()->gt($peserta->tanggal_selesai)) {
                $hariBerjalan = $totalHari;
            } else {
                $hariBerjalan = $peserta->tanggal_mulai->diffInWeekdays(now());
            }
        }

        return response()->json([
            'periode' => optional($peserta->tanggal_mulai)->format('d M Y') . ' - ' . optional($peserta->tanggal_selesai)->format('d M Y'),
            'divisi' => $peserta->divisi->nama ?? '-',
            'hari_berjalan' => $hariBerjalan,
            'total_hari' => $totalHari,
            'persentase_kehadiran' => $peserta->persen_kehadiran,
            'laporan_dibuat' => $peserta->laporanHarians()->count(),
            'status_sertifikat' => $peserta->sertifikat?->status ?? 'belum-ada',
        ]);
    }

    protected function persentaseKehadiranKeseluruhan(): int
    {
        $total = Absensi::count();
        if ($total === 0) {
            return 0;
        }

        return (int) round((Absensi::where('status', 'hadir')->count() / $total) * 100);
    }
}
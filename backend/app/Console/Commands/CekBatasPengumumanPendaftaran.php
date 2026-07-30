<?php

namespace App\Console\Commands;

use App\Models\Notifikasi;
use App\Models\Pendaftaran;
use Illuminate\Console\Command;

class CekBatasPengumumanPendaftaran extends Command
{
    protected $signature = 'notifikasi:cek-batas-pengumuman';

    protected $description = 'H-3 batas pengumuman → notif admin. Lewat 14 hari tanpa keputusan → hapus & minta calon peserta daftar ulang.';

    public function handle(): void
    {
        // ── H-3 menuju batas pengumuman, masih "menunggu" → notif admin ──
        $tigaHariLagi = Pendaftaran::where('status', 'menunggu')
            ->whereDate('created_at', now()->subDays(11)->toDateString())
            ->with('mahasiswa.user', 'divisi')
            ->get();

        foreach ($tigaHariLagi as $p) {
            $batas = $p->created_at->copy()->addDays(14)->translatedFormat('d M Y');
            Notifikasi::kirimKeSemuaAdminDedup(
                'Batas Pengumuman Tinggal 3 Hari',
                "Pendaftaran {$p->mahasiswa->user->name} (Divisi {$p->divisi->nama}) belum diverifikasi. Batas pengumuman: {$batas}.",
                "batas-pengumuman-h3:pendaftaran:{$p->id}"
            );
        }
        $this->info("Notif H-3 batas pengumuman: {$tigaHariLagi->count()} pendaftaran.");

        // ── Lewat 14 hari, masih "menunggu" → hapus & minta daftar ulang ──
        $kadaluarsa = Pendaftaran::where('status', 'menunggu')
            ->whereDate('created_at', '<=', now()->subDays(14)->toDateString())
            ->with('mahasiswa.user')
            ->get();

        foreach ($kadaluarsa as $p) {
            $user = $p->mahasiswa->user;
            Notifikasi::kirim(
                $user,
                'Pendaftaran Kedaluwarsa, Silakan Daftar Ulang',
                'Pendaftaran magang kamu belum diproses hingga melewati estimasi pengumuman (14 hari). Silakan lakukan pendaftaran ulang.',
                dedupeKey: "pendaftaran-kadaluarsa:user:{$user->id}:pendaftaran-{$p->id}"
            );
            $p->delete(); // dokumen ikut terhapus (cascadeOnDelete)
        }
        $this->info("Pendaftaran kedaluwarsa dihapus: {$kadaluarsa->count()}.");
    }
}
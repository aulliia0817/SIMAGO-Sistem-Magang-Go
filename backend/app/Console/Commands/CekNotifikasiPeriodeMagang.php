<?php

namespace App\Console\Commands;

use App\Models\Notifikasi;
use App\Models\PesertaMagang;
use Illuminate\Console\Command;

class CekNotifikasiPeriodeMagang extends Command
{
    protected $signature = 'notifikasi:cek-periode-magang';

    protected $description = 'Kirim notifikasi harian: peserta mulai magang hari ini, dan H-7 sebelum masa magang berakhir.';

    public function handle(): void
    {
        $hariIni = now()->toDateString();
        $tujuhHariLagi = now()->addDays(7)->toDateString();

        // ── Peserta mulai magang hari ini → notifikasi ke pembimbing ────────
        $mulaiHariIni = PesertaMagang::with('mahasiswa.user', 'pembimbing.user')
            ->where('status', 'aktif')
            ->whereDate('tanggal_mulai', $hariIni)
            ->get();

        foreach ($mulaiHariIni as $peserta) {
            if (!$peserta->pembimbing) {
                continue;
            }
            Notifikasi::kirim(
                $peserta->pembimbing->user,
                'Anda Mendapatkan Peserta Magang Baru',
                "{$peserta->mahasiswa->user->name} mulai magang hari ini di bawah bimbingan Anda.",
                dedupeKey: "mulai-hari-ini:peserta:{$peserta->id}:{$hariIni}"
            );
        }
        $this->info("Notifikasi 'mulai hari ini' terkirim untuk {$mulaiHariIni->count()} peserta.");

        // ── H-7 sebelum magang berakhir → pembimbing (2 notifikasi) + admin ──
        $akanSelesai = PesertaMagang::with('mahasiswa.user', 'pembimbing.user', 'divisi')
            ->where('status', 'aktif')
            ->whereDate('tanggal_selesai', $tujuhHariLagi)
            ->get();

        foreach ($akanSelesai as $peserta) {
            $namaPeserta = $peserta->mahasiswa->user->name;

            if ($peserta->pembimbing) {
                Notifikasi::kirim(
                    $peserta->pembimbing->user,
                    'Saatnya Memberikan Penilaian Peserta',
                    "Masa magang {$namaPeserta} akan berakhir dalam 7 hari. Segera siapkan penilaian/rekomendasi kelulusannya.",
                    dedupeKey: "saatnya-nilai:peserta:{$peserta->id}:{$tujuhHariLagi}"
                );
                Notifikasi::kirim(
                    $peserta->pembimbing->user,
                    'Masa Magang Peserta Akan Segera Berakhir',
                    "Masa magang {$namaPeserta} akan berakhir pada {$peserta->tanggal_selesai->format('d M Y')}.",
                    dedupeKey: "akan-berakhir:pembimbing:{$peserta->id}:{$tujuhHariLagi}"
                );
            }

            Notifikasi::kirimKeSemuaAdminDedup(
                'Peserta Magang Akan Segera Selesai',
                "Masa magang {$namaPeserta} (Divisi {$peserta->divisi->nama}) akan berakhir dalam 7 hari, pada {$peserta->tanggal_selesai->format('d M Y')}.",
                "akan-selesai:peserta:{$peserta->id}:{$tujuhHariLagi}"
            );
        }
        $this->info("Notifikasi 'H-7 akan selesai' terkirim untuk {$akanSelesai->count()} peserta.");
    }
}
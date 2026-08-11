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

        $mulaiHariIni = PesertaMagang::with('mahasiswa.user')
            ->where('status', 'aktif')
            ->whereDate('tanggal_mulai', $hariIni)
            ->get();
        $this->info("Peserta mulai magang hari ini: {$mulaiHariIni->count()}.");

        $akanSelesai = PesertaMagang::with('mahasiswa.user', 'divisi')
            ->where('status', 'aktif')
            ->whereDate('tanggal_selesai', $tujuhHariLagi)
            ->get();

        foreach ($akanSelesai as $peserta) {
            $namaPeserta = $peserta->mahasiswa->user->name;

            Notifikasi::kirimKeSemuaAdminDedup(
                'Peserta Magang Akan Segera Selesai',
                "Masa magang {$namaPeserta} (Divisi {$peserta->divisi->nama}) akan berakhir dalam 7 hari, pada {$peserta->tanggal_selesai->format('d M Y')}. Segera siapkan penilaian/rekomendasi kelulusan.",
                "akan-selesai:peserta:{$peserta->id}:{$tujuhHariLagi}"
            );
        }
        $this->info("Notifikasi 'H-7 akan selesai' terkirim untuk {$akanSelesai->count()} peserta.");
    }
}
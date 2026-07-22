<?php

namespace Database\Seeders;

use App\Models\Absensi;
use App\Models\Dokumen;
use App\Models\Divisi;
use App\Models\LaporanHarian;
use App\Models\Mahasiswa;
use App\Models\Pembimbing;
use App\Models\Pendaftaran;
use App\Models\PesertaMagang;
use App\Models\Sertifikat;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        \App\Models\Pengaturan::set('periode_pendaftaran_dibuka', '1');

        // ── Divisi ───────────────────────────────────────────────────────
        $divisi = collect([
            'Pelayanan' => 5,
            'Kependudukan' => 6,
            'Administrasi' => 6,
            'IT' => 5,
            'Keuangan' => 4,
        ])->map(fn ($kuota, $nama) => Divisi::create(['nama' => $nama, 'kuota' => $kuota]));

        // ── Admin ────────────────────────────────────────────────────────
        User::create([
            'name' => 'Admin SIMAGO',
            'email' => 'admin@simago.id',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);

        // ── Pembimbing (4 akun, sesuai data monitoring) ─────────────────
        $pembimbingSeed = [
            ['nama' => 'Ir. Hendra Wijaya', 'email' => 'pembimbing@simago.id', 'password' => 'pembimbing123', 'nip' => '198305122010011001', 'divisi' => 'Kependudukan', 'status' => 'aktif'],
            ['nama' => 'Dra. Retno Kusuma', 'email' => 'retno@simago.id', 'password' => 'pembimbing123', 'nip' => '197612032005012002', 'divisi' => 'Administrasi', 'status' => 'aktif'],
            ['nama' => 'Agus Purnomo, S.Kom', 'email' => 'agus@simago.id', 'password' => 'pembimbing123', 'nip' => '199001152015011003', 'divisi' => 'IT', 'status' => 'aktif'],
            ['nama' => 'Sri Mulyani, SE', 'email' => 'sri@simago.id', 'password' => 'pembimbing123', 'nip' => '198808202012012004', 'divisi' => 'Keuangan', 'status' => 'nonaktif'],
        ];

        $pembimbings = collect($pembimbingSeed)->map(function ($p) use ($divisi) {
            $user = User::create([
                'name' => $p['nama'],
                'email' => $p['email'],
                'password' => Hash::make($p['password']),
                'role' => 'pembimbing',
            ]);

            return Pembimbing::create([
                'user_id' => $user->id,
                'divisi_id' => $divisi[$p['divisi']]->id,
                'nip' => $p['nip'],
                'status' => $p['status'],
            ]);
        })->values();

        // ── Calon Magang demo (belum diseleksi) ─────────────────────────
        $calonUser = User::create([
            'name' => 'Dewi Rahayu',
            'email' => 'calon@simago.id',
            'password' => Hash::make('calon123'),
            'role' => 'calon',
        ]);
        $calonMhs = Mahasiswa::create([
            'user_id' => $calonUser->id,
            'nim' => '215150401111009',
            'tanggal_lahir' => '2003-03-15',
            'no_hp' => '+62 812-3456-7890',
            'institusi' => 'UB Malang',
            'jurusan' => 'Ilmu Komputer',
            'semester' => '6',
        ]);
        $calonPendaftaran = Pendaftaran::create([
            'mahasiswa_id' => $calonMhs->id,
            'divisi_id' => $divisi['Pelayanan']->id,
            'periode' => 'Juli — September 2025',
            'motivasi' => 'Ingin mengembangkan skill dan pengalaman kerja di instansi pemerintahan.',
            'status' => 'menunggu',
        ]);
        $dokumenJenis = [
            'Curriculum Vitae (CV)' => 'terverifikasi',
            'Surat Pengantar Kampus' => 'terverifikasi',
            'Surat Pengantar Kesbangpol' => 'menunggu',
            'Transkrip Nilai' => 'ditolak',
            'Kartu Tanda Mahasiswa (KTM)' => 'belum-upload',
            'Pas Foto 4x6' => 'belum-upload',
        ];
        foreach ($dokumenJenis as $jenis => $status) {
            Dokumen::create([
                'pendaftaran_id' => $calonPendaftaran->id,
                'jenis' => $jenis,
                'status' => $status,
                'catatan' => $status === 'ditolak' ? 'Dokumen tidak terbaca, harap upload ulang.' : null,
            ]);
        }

        // ── Peserta Magang demo (sudah aktif magang) ────────────────────
        $pesertaUser = User::create([
            'name' => 'Rian Pratama',
            'email' => 'peserta@simago.id',
            'password' => Hash::make('peserta123'),
            'role' => 'peserta',
        ]);
        $pesertaMhs = Mahasiswa::create([
            'user_id' => $pesertaUser->id,
            'nim' => '215150401111010',
            'tanggal_lahir' => '2002-11-02',
            'no_hp' => '+62 813-1111-2222',
            'institusi' => 'ITS Surabaya',
            'jurusan' => 'Sistem Informasi',
            'semester' => '7',
        ]);
        $pesertaPendaftaran = Pendaftaran::create([
            'mahasiswa_id' => $pesertaMhs->id,
            'divisi_id' => $divisi['Kependudukan']->id,
            'periode' => 'Juli — September 2025',
            'motivasi' => 'Tertarik pada pengelolaan data kependudukan.',
            'status' => 'disetujui',
        ]);
        $peserta = PesertaMagang::create([
            'pendaftaran_id' => $pesertaPendaftaran->id,
            'mahasiswa_id' => $pesertaMhs->id,
            'divisi_id' => $divisi['Kependudukan']->id,
            'pembimbing_id' => $pembimbings[0]->id, // Hendra Wijaya
            'tanggal_mulai' => now()->subWeekdays(18)->toDateString(),
            'tanggal_selesai' => now()->addWeekdays(42)->toDateString(),
            'status' => 'aktif',
        ]);

        // 20 hari absensi, 18 hadir (90%) sesuai mock "Kehadiran 90%"
        for ($i = 19; $i >= 0; $i--) {
            Absensi::create([
                'peserta_magang_id' => $peserta->id,
                'tanggal' => now()->subWeekdays($i)->toDateString(),
                'jam_masuk' => '08:00',
                'jam_keluar' => $i > 1 ? '16:00' : null,
                'status' => $i < 18 ? 'hadir' : ($i === 18 ? 'izin' : 'sakit'),
                'diverifikasi' => $i > 2,
            ]);
        }

        LaporanHarian::create([
            'peserta_magang_id' => $peserta->id,
            'judul' => 'Laporan Minggu 1 — Orientasi Kantor',
            'tanggal' => now()->subWeekdays(15)->toDateString(),
            'isi' => 'Hari pertama diisi dengan orientasi lingkungan kerja dan pengenalan tim divisi Kependudukan.',
            'status' => 'perlu-revisi',
            'catatan_pembimbing' => 'Tolong lengkapi dengan dokumentasi kegiatan.',
        ]);
        LaporanHarian::create([
            'peserta_magang_id' => $peserta->id,
            'judul' => 'Laporan Harian — Verifikasi Dokumen KK',
            'tanggal' => now()->subWeekdays(3)->toDateString(),
            'isi' => 'Membantu proses verifikasi berkas Kartu Keluarga warga yang mengajukan permohonan.',
            'status' => 'belum-review',
        ]);

        // ── Pendaftar lain (untuk mengisi tabel admin) ───────────────────
        $lainnya = [
            ['nama' => 'Siti Aminah', 'institusi' => 'UM Malang', 'jurusan' => 'Manajemen', 'divisi' => 'Administrasi', 'status' => 'menunggu'],
            ['nama' => 'Budi Santoso', 'institusi' => 'UNESA', 'jurusan' => 'Teknik Informatika', 'divisi' => 'IT', 'status' => 'ditolak'],
            ['nama' => 'Eka Wulandari', 'institusi' => 'Polinema', 'jurusan' => 'D3 Akuntansi', 'divisi' => 'Keuangan', 'status' => 'disetujui'],
            ['nama' => 'Farhan Maulana', 'institusi' => 'UNAIR', 'jurusan' => 'Hukum', 'divisi' => 'Administrasi', 'status' => 'menunggu'],
            ['nama' => 'Gita Permata', 'institusi' => 'UNS', 'jurusan' => 'Statistika', 'divisi' => 'IT', 'status' => 'disetujui'],
        ];

        foreach ($lainnya as $idx => $p) {
            $user = User::create([
                'name' => $p['nama'],
                'email' => strtolower(str_replace(' ', '.', $p['nama'])).'@mail.test',
                'password' => Hash::make('password'),
                'role' => 'calon',
            ]);
            $mhs = Mahasiswa::create([
                'user_id' => $user->id,
                'nim' => '2151504'.str_pad((string) ($idx + 20), 5, '0', STR_PAD_LEFT),
                'institusi' => $p['institusi'],
                'jurusan' => $p['jurusan'],
            ]);
            Pendaftaran::create([
                'mahasiswa_id' => $mhs->id,
                'divisi_id' => $divisi[$p['divisi']]->id,
                'periode' => 'Juli — September 2025',
                'status' => $p['status'],
                'created_at' => now()->subDays(10 - $idx),
            ]);
        }
    }
}

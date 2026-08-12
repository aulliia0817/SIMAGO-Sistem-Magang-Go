<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePendaftaranRequest;
use App\Http\Requests\UpdatePendaftaranStatusRequest;
use App\Http\Resources\PendaftaranResource;
use App\Models\Mahasiswa;
use App\Models\Notifikasi;
use App\Models\Pendaftaran;
use App\Models\Pengaturan;
use App\Models\PesertaMagang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PendaftaranController extends Controller
{
    /** Admin: daftar seluruh pendaftar, dengan filter pencarian & status. */
    public function index(Request $request)
    {
        $query = Pendaftaran::with(['mahasiswa.user', 'divisi', 'pesertaMagang']);

        if ($request->boolean('hanya_terkirim')) {
            $query->whereNotNull('dokumen_dikirim_at');
        }

        if ($search = $request->query('search')) {
            $query->whereHas('mahasiswa.user', fn($q) => $q->where('name', 'like', "%{$search}%"));
        }

        if ($status = $request->query('status')) {
            if ($status === 'belum_ada_data') {
                $query->where('status', 'menunggu')->whereNull('dokumen_dikirim_at');
            } elseif ($status === 'menunggu') {
                $query->where('status', 'menunggu')->whereNotNull('dokumen_dikirim_at');
            } elseif ($status !== 'semua') {
                $query->where('status', $status);
            }
        }

        if ($dari = $request->query('dari_tanggal')) {
            $query->whereDate('created_at', '>=', $dari);
        }

        if ($sampai = $request->query('sampai_tanggal')) {
            $query->whereDate('created_at', '<=', $sampai);
        }

        return PendaftaranResource::collection($query->latest()->paginate($request->integer('per_page', 15)));
    }

    public function show(Pendaftaran $pendaftaran)
    {
        return new PendaftaranResource($pendaftaran->load(['mahasiswa.user', 'divisi', 'dokumens']));
    }

    /** Calon Magang: submit pendaftaran baru (juga membuat profil Mahasiswa jika belum ada). */
    public function store(StorePendaftaranRequest $request)
    {
        abort_unless(
            Pengaturan::bool('periode_pendaftaran_dibuka', true),
            403,
            'Periode pendaftaran magang sedang ditutup oleh admin. Silakan coba lagi nanti.'
        );

        $user = $request->user();
        $data = $request->validated();

        $mahasiswa = $user->mahasiswa;
        if ($mahasiswa) {
            $masihMenunggu = $mahasiswa->pendaftarans()->where('status', 'menunggu')->exists();
            abort_if(
                $masihMenunggu,
                422,
                'Anda masih memiliki pendaftaran yang sedang diproses. Tunggu hasil seleksi, atau sampai batas pengumuman (14 hari) terlewati, sebelum mendaftar ulang.'
            );
        }

        $mahasiswa = $mahasiswa ?? Mahasiswa::create([
            'user_id' => $user->id,
            'nim' => $data['nim'],
            'tanggal_lahir' => $data['tanggal_lahir'] ?? null,
            'no_hp' => $data['no_hp'] ?? null,
            'institusi' => $data['institusi'],
            'jurusan' => $data['jurusan'],
            'semester' => $data['semester'] ?? null,
        ]);

        if ($data['nama'] !== $user->name) {
            $user->update(['name' => $data['nama']]);
        }

        $periode = \Carbon\Carbon::parse($data['tanggal_mulai'])->translatedFormat('d M Y')
            . ' – ' . \Carbon\Carbon::parse($data['tanggal_selesai'])->translatedFormat('d M Y');

        $pendaftaran = Pendaftaran::create([
            'mahasiswa_id' => $mahasiswa->id,
            'divisi_id' => $data['divisi_id'],
            'periode' => $periode,
            'tanggal_mulai' => $data['tanggal_mulai'],
            'tanggal_selesai' => $data['tanggal_selesai'],
            'motivasi' => $data['motivasi'] ?? null,
            'status' => 'menunggu',
        ]);

        $dokumenWajib = ['Curriculum Vitae (CV)', 'Surat Pengantar Kampus', 'Surat Pengantar Bakesbangpol Kabupaten Madiun', 'Proposal', 'Transkrip Nilai', 'Kartu Tanda Mahasiswa (KTM)', 'Pas Foto 4x6'];
        foreach ($dokumenWajib as $jenis) {
            $pendaftaran->dokumens()->create(['jenis' => $jenis, 'status' => 'belum-upload']);
        }

        Notifikasi::kirimKeRole(
            'admin',
            'Pendaftaran Baru Telah Diterima',
            "{$user->name} mengajukan pendaftaran magang untuk divisi {$pendaftaran->divisi->nama}.",
            halaman: 'pendaftar'
        );

        return new PendaftaranResource($pendaftaran->load(['mahasiswa.user', 'divisi', 'dokumens']));
    }

    /** Calon/Peserta: lihat status pendaftaran milik sendiri (yang terbaru saja). */
    public function mine(Request $request)
    {
        $pendaftaran = $request->user()->mahasiswa?->pendaftarans()->with(['divisi', 'dokumens'])->latest()->first();

        if (!$pendaftaran) {
            return response()->json(['message' => 'Belum ada pendaftaran.'], 404);
        }

        return new PendaftaranResource($pendaftaran);
    }

    /**
     * Calon/Peserta: Riwayat Pendaftaran — SEMUA pendaftaran yang pernah
     * diajukan (termasuk yang sudah ditolak/kedaluwarsa), terbaru dulu.
     * Riwayat ini tidak pernah hilang meski calon mendaftar ulang setelah
     * lewat batas pengumuman (lihat CekBatasPengumumanPendaftaran).
     */
    public function riwayat(Request $request)
    {
        $mahasiswa = $request->user()->mahasiswa;

        if (!$mahasiswa) {
            return response()->json(['data' => []]);
        }

        $list = $mahasiswa->pendaftarans()->with('divisi')->latest()->get();

        return PendaftaranResource::collection($list);
    }

    /**
     * Calon/Peserta: detail satu pendaftaran spesifik milik sendiri (dipakai
     * halaman Tracking Status setelah memilih salah satu dari Riwayat
     * Pendaftaran). Hanya bisa diakses oleh pemiliknya sendiri.
     */
    public function showMine(Request $request, Pendaftaran $pendaftaran)
    {
        $ownerId = $pendaftaran->mahasiswa->user_id ?? null;
        abort_unless($ownerId === $request->user()->id, 403, 'Anda tidak memiliki akses ke pendaftaran ini.');

        return new PendaftaranResource($pendaftaran->load(['divisi', 'dokumens']));
    }

    /**
     * Calon Magang: tekan "Kirim Berkas" setelah semua dokumen wajib terupload.
     * Mengunci dokumen dari perubahan (kecuali yang ditolak admin) dan
     * memunculkan pendaftaran ini di daftar verifikasi admin.
     */
    public function kirimDokumen(Request $request)
    {
        $pendaftaran = $request->user()->mahasiswa?->pendaftarans()->with('dokumens')->latest()->first();

        abort_unless($pendaftaran, 404, 'Belum ada pendaftaran.');

        $belumLengkap = $pendaftaran->dokumens
            ->where('status', '!=', 'ditolak')
            ->contains(fn($d) => empty($d->file_path));

        abort_if($belumLengkap, 422, 'Masih ada dokumen wajib yang belum diupload.');

        $pendaftaran->update(['dokumen_dikirim_at' => now()]);

        Notifikasi::kirimKeRole(
            'admin',
            'Berkas Pendaftaran Telah Dikirim',
            "{$request->user()->name} telah mengirimkan seluruh berkas untuk diverifikasi.",
            halaman: 'verifikasi',
            pendaftaranId: $pendaftaran->id
        );

        return new PendaftaranResource($pendaftaran->fresh(['mahasiswa.user', 'divisi', 'dokumens']));
    }

    /**
     * Admin: proses seleksi (ubah status). Jika disetujui, otomatis membuat
     * PesertaMagang dengan pembimbing & periode yang ditentukan.
     */
    public function updateStatus(UpdatePendaftaranStatusRequest $request, Pendaftaran $pendaftaran)
    {
        $pendaftaran->load(['mahasiswa.user', 'divisi']);

        if (in_array($data['status'], ['disetujui', 'ditolak'])) {
            $diterima = $data['status'] === 'disetujui';

            Notifikasi::kirim(
                $pendaftaran->mahasiswa->user,
                'Hasil Seleksi Pendaftaran Magang',
                $diterima
                    ? "Selamat! Pendaftaran magang Anda di divisi {$pendaftaran->divisi->nama} telah disetujui."
                    : 'Mohon maaf, pendaftaran magang Anda belum dapat kami terima kali ini.',
                halaman: 'tracking',
                pendaftaranId: $pendaftaran->id
            );
        }

        return new PendaftaranResource($pendaftaran);
    }
    
    public function destroy(Pendaftaran $pendaftaran)
    {
        $pendaftaran->delete();

        return response()->json(['message' => 'Pendaftaran dihapus.']);
    }
}
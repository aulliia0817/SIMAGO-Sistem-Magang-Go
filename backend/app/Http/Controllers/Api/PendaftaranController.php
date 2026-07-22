<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePendaftaranRequest;
use App\Http\Requests\UpdatePendaftaranStatusRequest;
use App\Http\Resources\PendaftaranResource;
use App\Models\Mahasiswa;
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

        if ($search = $request->query('search')) {
            $query->whereHas('mahasiswa.user', fn ($q) => $q->where('name', 'like', "%{$search}%"));
        }

        if ($status = $request->query('status')) {
            if ($status !== 'semua') {
                $query->where('status', $status);
            }
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

        $mahasiswa = $user->mahasiswa ?? Mahasiswa::create([
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

        $pendaftaran = Pendaftaran::create([
            'mahasiswa_id' => $mahasiswa->id,
            'divisi_id' => $data['divisi_id'],
            'periode' => $data['periode'],
            'motivasi' => $data['motivasi'] ?? null,
            'status' => 'menunggu',
        ]);

        $dokumenWajib = ['Curriculum Vitae (CV)', 'Surat Pengantar Kampus', 'Surat Pengantar Kesbangpol', 'Transkrip Nilai', 'Kartu Tanda Mahasiswa (KTM)', 'Pas Foto 4x6'];
        foreach ($dokumenWajib as $jenis) {
            $pendaftaran->dokumens()->create(['jenis' => $jenis, 'status' => 'belum-upload']);
        }

        return new PendaftaranResource($pendaftaran->load(['mahasiswa.user', 'divisi', 'dokumens']));
    }

    /** Calon/Peserta: lihat status pendaftaran milik sendiri. */
    public function mine(Request $request)
    {
        $pendaftaran = $request->user()->mahasiswa?->pendaftarans()->with(['divisi', 'dokumens'])->latest()->first();

        if (! $pendaftaran) {
            return response()->json(['message' => 'Belum ada pendaftaran.'], 404);
        }

        return new PendaftaranResource($pendaftaran);
    }

    /**
     * Admin: proses seleksi (ubah status). Jika disetujui, otomatis membuat
     * PesertaMagang dengan pembimbing & periode yang ditentukan.
     */
    public function updateStatus(UpdatePendaftaranStatusRequest $request, Pendaftaran $pendaftaran)
    {
        $data = $request->validated();

        DB::transaction(function () use ($pendaftaran, $data) {
            $pendaftaran->update([
                'status' => $data['status'],
                'catatan_admin' => $data['catatan_admin'] ?? $pendaftaran->catatan_admin,
            ]);

            if ($data['status'] === 'disetujui' && ! $pendaftaran->pesertaMagang) {
                // Seleksi hanya meloloskan pendaftar (tidak ada form tambahan
                // di halaman ini). Pembimbing final ditentukan admin berikutnya
                // di halaman Penempatan Peserta.
                PesertaMagang::create([
                    'pendaftaran_id' => $pendaftaran->id,
                    'mahasiswa_id' => $pendaftaran->mahasiswa_id,
                    'divisi_id' => $pendaftaran->divisi_id,
                    'pembimbing_id' => null,
                    'tanggal_mulai' => now()->toDateString(),
                    'tanggal_selesai' => now()->addMonths(3)->toDateString(),
                    'status' => 'aktif',
                ]);

                $pendaftaran->mahasiswa->user()->update(['role' => 'peserta']);
            }
        });

        return new PendaftaranResource($pendaftaran->fresh(['mahasiswa.user', 'divisi']));
    }

    public function destroy(Pendaftaran $pendaftaran)
    {
        $pendaftaran->delete();

        return response()->json(['message' => 'Pendaftaran dihapus.']);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SertifikatResource;
use App\Models\Notifikasi;
use App\Models\PesertaMagang;
use App\Models\Sertifikat;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SertifikatController extends Controller
{
    /** Admin: kelola seluruh sertifikat. */
    public function index(Request $request)
    {
        $query = Sertifikat::with('pesertaMagang.mahasiswa.user', 'pesertaMagang.divisi');

        if ($status = $request->query('status')) {
            if ($status !== 'semua') {
                $query->where('status', $status);
            }
        }

        return SertifikatResource::collection($query->latest()->get());
    }

    /**
     * Admin: terbitkan sertifikat baru untuk peserta yang sudah selesai magang.
     * PDF-nya dibuat OTOMATIS dari template uji coba di
     * resources/views/sertifikat/sertifikat.blade.php — admin cukup masukkan
     * nomor sertifikat, tidak perlu upload file manual.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'peserta_magang_id' => ['required', 'exists:peserta_magangs,id', 'unique:sertifikats,peserta_magang_id'],
            'nomor' => ['required', 'string', 'unique:sertifikats,nomor'],
        ]);

        $peserta = PesertaMagang::with('mahasiswa.user', 'divisi')->findOrFail($data['peserta_magang_id']);
        abort_unless($peserta->status === 'selesai', 422, 'Sertifikat hanya bisa diterbitkan untuk peserta yang statusnya sudah "selesai" magang.');

        $sertifikat = Sertifikat::create($data + ['status' => 'proses']);

        $this->terbitkanSertifikat($sertifikat, $peserta);

        return new SertifikatResource($sertifikat->fresh(['pesertaMagang.mahasiswa.user', 'pesertaMagang.divisi']));
    }

    /**
     * Buat PDF sertifikat dari template, simpan ke storage, tandai status
     * 'terbit', lalu beri tahu peserta lewat notifikasi.
     */
    protected function terbitkanSertifikat(Sertifikat $sertifikat, PesertaMagang $peserta): void
    {
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('sertifikat.sertifikat', [
            'nomor' => $sertifikat->nomor,
            'nama' => $peserta->mahasiswa->user->name ?? '-',
            'institusi' => $peserta->mahasiswa->institusi ?? '-',
            'jurusan' => $peserta->mahasiswa->jurusan ?? '-',
            'divisi' => $peserta->divisi->nama ?? '-',
            'tanggalMulai' => optional($peserta->tanggal_mulai)->translatedFormat('d M Y'),
            'tanggalSelesai' => optional($peserta->tanggal_selesai)->translatedFormat('d M Y'),
            'tanggalTerbit' => now()->locale('id')->translatedFormat('d F Y'),
        ])->setPaper('a4', 'landscape');

        $namaFile = 'sertifikat-' . \Illuminate\Support\Str::slug($sertifikat->nomor) . '-' . $sertifikat->id . '.pdf';
        $path = 'sertifikat/' . $namaFile;

        $tersimpan = \Storage::disk('public')->put($path, $pdf->output());

        if (!$tersimpan || !\Storage::disk('public')->exists($path)) {
            throw new \RuntimeException(
                'Gagal menyimpan file sertifikat ke storage (folder storage/app/public mungkin tidak bisa ditulis). '
                . 'Pastikan folder storage/app/public ada dan writable, lalu coba terbitkan ulang.'
            );
        }

        $sertifikat->update([
            'file_path' => $path,
            'status' => 'terbit',
            'tanggal_terbit' => now()->toDateString(),
        ]);

        Notifikasi::kirim(
            $peserta->mahasiswa->user,
            'Sertifikat Magang Sudah Dapat Diunduh',
            "Selamat! Program magang Anda telah selesai dan sertifikat (No. {$sertifikat->nomor}) sudah dapat diunduh.",
            halaman: 'sertifikat-peserta'
        );
    }

    /**
     * Admin: terbitkan ULANG sertifikat dengan nomor baru — menggantikan
     * nomor & file PDF lama sepenuhnya (bukan menambah data baru). Dipakai
     * juga saat sekadar terbit ulang PDF (template diganti) tanpa ubah nomor.
     */
    public function update(Request $request, Sertifikat $sertifikat)
    {
        $data = $request->validate([
            'nomor' => [
                'sometimes',
                'required',
                'string',
                Rule::unique('sertifikats', 'nomor')->ignore($sertifikat->id),
            ],
        ]);

        $sertifikat->load('pesertaMagang.mahasiswa.user', 'pesertaMagang.divisi');

        $pathLama = $sertifikat->file_path;

        if (isset($data['nomor'])) {
            $sertifikat->update(['nomor' => $data['nomor']]);
        }

        $this->terbitkanSertifikat($sertifikat, $sertifikat->pesertaMagang);

        // Nomor baru → nama file baru (lihat terbitkanSertifikat). File PDF
        // lama jadi tidak terpakai lagi, jadi dihapus supaya data lama benar-benar
        // tergantikan, bukan menumpuk sebagai file sampah di storage.
        if ($pathLama && $pathLama !== $sertifikat->file_path && \Storage::disk('public')->exists($pathLama)) {
            \Storage::disk('public')->delete($pathLama);
        }

        return new SertifikatResource($sertifikat->fresh(['pesertaMagang.mahasiswa.user', 'pesertaMagang.divisi']));
    }

    /** Peserta: sertifikat milik sendiri. */
    public function mine(Request $request)
    {
        $peserta = $request->user()->mahasiswa?->pesertaMagang;
        abort_unless($peserta, 404, 'Anda belum menjadi peserta magang aktif.');

        $sertifikat = $peserta->sertifikat;
        abort_unless($sertifikat, 404, 'Sertifikat belum diterbitkan.');

        return new SertifikatResource($sertifikat);
    }

    /** Unduh file PDF sertifikat lewat backend (lihat catatan di DokumenController::file). */
    public function file(Request $request, Sertifikat $sertifikat)
    {
        $user = $request->user();
        $isOwner = ($sertifikat->pesertaMagang->mahasiswa->user_id ?? null) === $user->id;

        abort_unless(
            in_array($user->role, ['admin', 'pembimbing']) || $isOwner,
            403,
            'Anda tidak memiliki akses ke sertifikat ini.'
        );
        abort_unless($sertifikat->file_path, 404, 'File sertifikat belum diupload.');
        abort_unless(\Storage::disk('public')->exists($sertifikat->file_path), 404, 'File tidak ditemukan di server.');

        // Nomor sertifikat (mis. "SIMAGO/2026/0001") dipakai apa adanya di UI,
        // tapi tidak boleh dipakai langsung sebagai nama file unduhan — Symfony
        // melempar error kalau nama file mengandung "/" atau "\".
        $namaUnduh = str_replace(['/', '\\'], '-', "Sertifikat-{$sertifikat->nomor}.pdf");

        return \Storage::disk('public')->response($sertifikat->file_path, $namaUnduh);
    }
}
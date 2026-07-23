<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SertifikatResource;
use App\Models\PesertaMagang;
use App\Models\Sertifikat;
use Illuminate\Http\Request;

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

    /** Admin: terbitkan sertifikat baru untuk peserta yang sudah selesai magang. */
    public function store(Request $request)
    {
        $data = $request->validate([
            'peserta_magang_id' => ['required', 'exists:peserta_magangs,id', 'unique:sertifikats,peserta_magang_id'],
            'nomor' => ['required', 'string', 'unique:sertifikats,nomor'],
        ]);

        $sertifikat = Sertifikat::create($data + ['status' => 'proses']);

        return new SertifikatResource($sertifikat->load('pesertaMagang.mahasiswa.user', 'pesertaMagang.divisi'));
    }

    /** Admin: tandai sertifikat sebagai terbit (dengan file). */
    public function update(Request $request, Sertifikat $sertifikat)
    {
        $data = $request->validate([
            'status' => ['required', 'in:proses,terbit'],
            'file' => ['nullable', 'file', 'mimes:pdf', 'max:5120'],
        ]);

        if ($request->hasFile('file')) {
            $data['file_path'] = $request->file('file')->store('sertifikat', 'public');
        }

        if ($data['status'] === 'terbit') {
            $data['tanggal_terbit'] = now()->toDateString();
        }

        $sertifikat->update($data);

        return new SertifikatResource($sertifikat);
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

        return \Storage::disk('public')->response($sertifikat->file_path, "Sertifikat-{$sertifikat->nomor}.pdf");
    }
}
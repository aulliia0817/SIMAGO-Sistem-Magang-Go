<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAbsensiRequest;
use App\Http\Resources\AbsensiResource;
use App\Models\Absensi;
use Illuminate\Http\Request;

class AbsensiController extends Controller
{
    /**
     * Admin: monitoring seluruh kehadiran.
     * Pembimbing: kehadiran peserta bimbingannya (utk verifikasi).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Absensi::with('pesertaMagang.mahasiswa.user', 'pesertaMagang.divisi');

        if ($user->role === 'pembimbing') {
            $query->whereHas('pesertaMagang', fn($q) => $q->where('pembimbing_id', $user->pembimbing?->id));
        }

        if ($belumVerifikasi = $request->boolean('belum_verifikasi')) {
            $query->where('diverifikasi', false);
        }

        return AbsensiResource::collection($query->latest('tanggal')->paginate($request->integer('per_page', 20)));
    }

    /** Peserta: riwayat absensi milik sendiri. */
    public function mine(Request $request)
    {
        $peserta = $request->user()->mahasiswa?->pesertaMagang;
        abort_unless($peserta, 404, 'Anda belum menjadi peserta magang aktif.');

        return AbsensiResource::collection($peserta->absensis()->latest('tanggal')->get());
    }

    /** Peserta: absen hari ini (check-in). */
    public function store(StoreAbsensiRequest $request)
    {
        $peserta = $request->user()->mahasiswa?->pesertaMagang;
        abort_unless($peserta, 404, 'Anda belum menjadi peserta magang aktif.');

        $absensi = $peserta->absensis()->updateOrCreate(
            ['tanggal' => now()->toDateString()],
            $request->validated() + ['diverifikasi' => false]
        );

        return new AbsensiResource($absensi);
    }

    /** Peserta: check-out hari ini (mengisi jam_keluar pada absensi yang sudah check-in). */
    public function checkout(Request $request)
    {
        $peserta = $request->user()->mahasiswa?->pesertaMagang;
        abort_unless($peserta, 404, 'Anda belum menjadi peserta magang aktif.');

        $absensi = $peserta->absensis()->whereDate('tanggal', now()->toDateString())->first();
        abort_unless($absensi, 422, 'Anda belum check-in hari ini.');
        abort_if($absensi->jam_keluar, 422, 'Anda sudah check-out hari ini.');

        $absensi->update(['jam_keluar' => now()->format('H:i')]);

        return new AbsensiResource($absensi);
    }

    /** Pembimbing: verifikasi absensi peserta bimbingan. */
    public function verify(Request $request, Absensi $absensi)
    {
        $user = $request->user();
        abort_unless(
            $user->role === 'admin' || $absensi->pesertaMagang->pembimbing_id === $user->pembimbing?->id,
            403,
            'Anda tidak memiliki akses untuk memverifikasi absensi ini.'
        );

        $absensi->update(['diverifikasi' => true]);

        return new AbsensiResource($absensi);
    }
}

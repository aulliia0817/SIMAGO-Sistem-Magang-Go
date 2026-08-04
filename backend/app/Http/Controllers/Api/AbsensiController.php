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

        if ($pesertaMagangId = $request->query('peserta_magang_id')) {
            $query->where('peserta_magang_id', $pesertaMagangId);
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

    /** Peserta: isi absensi hari ini (datang / pulang / izin / sakit / lupa absen). */
    public function store(StoreAbsensiRequest $request)
    {
        $peserta = $request->user()->mahasiswa?->pesertaMagang;
        abort_unless($peserta, 404, 'Anda belum menjadi peserta magang aktif.');

        $data = $request->validated();
        $sift = $data['sift'];

        $payload = [
            'sift' => $sift,
            'keterangan' => $data['keterangan'] ?? null,
            'di_luar_jam' => $request->boolean('di_luar_jam'),
            'diverifikasi' => false,
        ];

        if (in_array($sift, ['izin', 'sakit'], true)) {
            $payload['status'] = $sift;
        } elseif ($sift === 'lupa_absen') {
            // Diajukan sebagai pengecualian; tetap menunggu keputusan pembimbing saat verifikasi.
            $payload['status'] = 'alpha';
        } else {
            $payload['status'] = 'hadir';
            if ($sift === 'datang') {
                $payload['jam_masuk'] = $data['jam_masuk'] ?? now()->format('H:i');
            } else {
                $payload['jam_keluar'] = $data['jam_keluar'] ?? now()->format('H:i');
            }
        }

        if ($request->hasFile('bukti')) {
            $payload['bukti_path'] = $request->file('bukti')->store('bukti-absensi', 'public');
        }

        $absensi = $peserta->absensis()->updateOrCreate(
            ['tanggal' => now()->toDateString()],
            $payload
        );

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

    /**
     * Buka/unduh bukti foto absensi (izin/sakit/lupa absen) langsung lewat backend
     * (tidak bergantung pada symlink storage:link). Diizinkan untuk admin/pembimbing
     * (semua bukti) atau peserta pemilik absensi itu sendiri.
     */
    public function file(Request $request, Absensi $absensi)
    {
        $user = $request->user();
        $isOwner = ($absensi->pesertaMagang->mahasiswa->user_id ?? null) === $user->id;

        abort_unless(
            in_array($user->role, ['admin', 'pembimbing']) || $isOwner,
            403,
            'Anda tidak memiliki akses ke bukti absensi ini.'
        );
        abort_unless($absensi->bukti_path, 404, 'Bukti absensi ini belum diunggah.');
        abort_unless(\Storage::disk('public')->exists($absensi->bukti_path), 404, 'File tidak ditemukan di server.');

        return \Storage::disk('public')->response($absensi->bukti_path);
    }
}

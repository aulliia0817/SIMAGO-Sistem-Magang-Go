<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAbsensiRequest;
use App\Http\Resources\AbsensiResource;
use App\Models\Absensi;
use Illuminate\Http\Request;

class AbsensiController extends Controller
{
    /** Admin: monitoring seluruh kehadiran peserta. */
    public function index(Request $request)
    {
        $query = Absensi::with('pesertaMagang.mahasiswa.user', 'pesertaMagang.divisi');

        return AbsensiResource::collection($query->latest('tanggal')->paginate($request->integer('per_page', 20)));
    }

    /** Peserta: riwayat absensi milik sendiri. */
    public function mine(Request $request)
    {
        $peserta = $request->user()->mahasiswa?->pesertaMagang;
        abort_unless($peserta, 404, 'Anda belum menjadi peserta magang aktif.');

        return AbsensiResource::collection($peserta->absensis()->latest('tanggal')->get());
    }

    /** Peserta: isi absensi hari ini (datang / pulang / izin / sakit / lupa absen). Langsung terverifikasi. */
    public function store(StoreAbsensiRequest $request)
    {
        $peserta = $request->user()->mahasiswa?->pesertaMagang;
        abort_unless($peserta, 404, 'Anda belum menjadi peserta magang aktif.');

        $hariIni = now()->startOfDay();
        if ($peserta->tanggal_mulai && $hariIni->lt($peserta->tanggal_mulai)) {
            abort(422, 'Periode magang Anda belum dimulai. Absensi baru bisa diisi mulai tanggal '
                . $peserta->tanggal_mulai->translatedFormat('d F Y') . '.');
        }
        if ($peserta->tanggal_selesai && $hariIni->gt($peserta->tanggal_selesai)) {
            abort(422, 'Periode magang Anda sudah berakhir sejak tanggal '
                . $peserta->tanggal_selesai->translatedFormat('d F Y') . ', absensi tidak dapat diisi lagi.');
        }

        $data = $request->validated();
        $sift = $data['sift'];

        $payload = [
            'sift' => $sift,
            'keterangan' => $data['keterangan'] ?? null,
            'di_luar_jam' => $request->boolean('di_luar_jam'),
            'diverifikasi' => true,
        ];

        if (in_array($sift, ['izin', 'sakit'], true)) {
            $payload['status'] = $sift;
        } elseif ($sift === 'lupa_absen') {
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
}
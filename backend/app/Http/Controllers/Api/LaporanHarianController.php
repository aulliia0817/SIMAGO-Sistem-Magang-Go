<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewLaporanHarianRequest;
use App\Http\Requests\StoreLaporanHarianRequest;
use App\Http\Resources\LaporanHarianResource;
use App\Models\LaporanHarian;
use Illuminate\Http\Request;

class LaporanHarianController extends Controller
{
    /**
     * Admin: rekap seluruh laporan harian.
     * Pembimbing: laporan milik peserta bimbingannya (halaman Review Laporan).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = LaporanHarian::with('pesertaMagang.mahasiswa.user');

        if ($user->role === 'pembimbing') {
            $query->whereHas('pesertaMagang', fn ($q) => $q->where('pembimbing_id', $user->pembimbing?->id));
        }

        if ($status = $request->query('status')) {
            if ($status !== 'semua') {
                $query->where('status', $status);
            }
        }

        return LaporanHarianResource::collection($query->latest('tanggal')->paginate($request->integer('per_page', 20)));
    }

    /** Peserta: daftar laporan harian milik sendiri. */
    public function mine(Request $request)
    {
        $peserta = $request->user()->mahasiswa?->pesertaMagang;
        abort_unless($peserta, 404, 'Anda belum menjadi peserta magang aktif.');

        return LaporanHarianResource::collection($peserta->laporanHarians()->latest('tanggal')->get());
    }

    /** Peserta: buat laporan harian baru. */
    public function store(StoreLaporanHarianRequest $request)
    {
        $peserta = $request->user()->mahasiswa?->pesertaMagang;
        abort_unless($peserta, 404, 'Anda belum menjadi peserta magang aktif.');

        $laporan = $peserta->laporanHarians()->create($request->validated() + ['status' => 'belum-review']);

        return new LaporanHarianResource($laporan);
    }

    /** Pembimbing: review (setujui/minta revisi) laporan harian. */
    public function review(ReviewLaporanHarianRequest $request, LaporanHarian $laporanHarian)
    {
        $user = $request->user();
        abort_unless(
            $user->role === 'admin' || $laporanHarian->pesertaMagang->pembimbing_id === $user->pembimbing?->id,
            403,
            'Anda tidak memiliki akses untuk mereview laporan ini.'
        );

        $laporanHarian->update($request->validated());

        return new LaporanHarianResource($laporanHarian);
    }
}

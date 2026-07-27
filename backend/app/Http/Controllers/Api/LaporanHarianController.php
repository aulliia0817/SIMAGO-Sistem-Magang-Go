<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewLaporanHarianRequest;
use App\Http\Requests\StoreLaporanHarianRequest;
use App\Http\Resources\LaporanHarianResource;
use App\Models\LaporanHarian;
use App\Models\Notifikasi;
use Illuminate\Http\Request;

class LaporanHarianController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = LaporanHarian::with('pesertaMagang.mahasiswa.user');

        if ($user->role === 'pembimbing') {
            $query->whereHas('pesertaMagang', fn($q) => $q->where('pembimbing_id', $user->pembimbing?->id));
        }

        if ($status = $request->query('status')) {
            if ($status !== 'semua') {
                $query->where('status', $status);
            }
        }

        return LaporanHarianResource::collection($query->latest('tanggal')->paginate($request->integer('per_page', 20)));
    }

    public function mine(Request $request)
    {
        $peserta = $request->user()->mahasiswa?->pesertaMagang;
        abort_unless($peserta, 404, 'Anda belum menjadi peserta magang aktif.');

        return LaporanHarianResource::collection($peserta->laporanHarians()->latest('tanggal')->get());
    }

    public function store(StoreLaporanHarianRequest $request)
    {
        $peserta = $request->user()->mahasiswa?->pesertaMagang;
        abort_unless($peserta, 404, 'Anda belum menjadi peserta magang aktif.');

        $laporan = $peserta->laporanHarians()->create($request->validated() + ['status' => 'belum-review']);

        if ($peserta->pembimbing) {
            Notifikasi::kirim(
                $peserta->pembimbing->user,
                'Laporan Harian Baru Menunggu Review',
                "{$peserta->mahasiswa->user->name} mengirim laporan \"{$laporan->judul}\" untuk direview.",
                halaman: 'review-laporan'
            );
        }

        return new LaporanHarianResource($laporan);
    }

    public function review(ReviewLaporanHarianRequest $request, LaporanHarian $laporanHarian)
    {
        $user = $request->user();
        abort_unless(
            $user->role === 'admin' || $laporanHarian->pesertaMagang->pembimbing_id === $user->pembimbing?->id,
            403,
            'Anda tidak memiliki akses untuk mereview laporan ini.'
        );

        $laporanHarian->update($request->validated());

        $penerima = $laporanHarian->pesertaMagang->mahasiswa->user;
        $data = $request->validated();
        if ($data['status'] === 'perlu-revisi') {
            Notifikasi::kirim($penerima, 'Laporan Perlu Direvisi', "Laporan \"{$laporanHarian->judul}\" perlu direvisi. " . ($data['catatan_pembimbing'] ?? ''), halaman: 'laporan-peserta');
        } elseif (!empty($data['catatan_pembimbing'])) {
            Notifikasi::kirim($penerima, 'Pembimbing Memberikan Komentar', "Komentar untuk laporan \"{$laporanHarian->judul}\": {$data['catatan_pembimbing']}", halaman: 'laporan-peserta');
        }

        return new LaporanHarianResource($laporanHarian);
    }

    /** Peserta: revisi ulang laporan yang diminta pembimbing untuk direvisi. */
    public function revise(Request $request, LaporanHarian $laporanHarian)
    {
        $peserta = $request->user()->mahasiswa?->pesertaMagang;
        abort_unless(
            $peserta && $laporanHarian->peserta_magang_id === $peserta->id,
            403,
            'Anda tidak memiliki akses untuk merevisi laporan ini.'
        );
        abort_unless($laporanHarian->status === 'perlu-revisi', 422, 'Laporan ini tidak sedang meminta revisi.');

        $data = $request->validate([
            'judul' => ['sometimes', 'required', 'string', 'max:200'],
            'isi' => ['required', 'string'],
        ]);

        $laporanHarian->update($data + ['status' => 'belum-review']);

        if ($peserta->pembimbing) {
            Notifikasi::kirim(
                $peserta->pembimbing->user,
                'Peserta Merevisi Laporan',
                "{$peserta->mahasiswa->user->name} mengirim revisi untuk laporan \"{$laporanHarian->judul}\".",
                halaman: 'review-laporan'
            );
        }

        return new LaporanHarianResource($laporanHarian);
    }
}
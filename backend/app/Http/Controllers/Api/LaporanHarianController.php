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
        $query = LaporanHarian::with('pesertaMagang.mahasiswa.user');

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

        Notifikasi::kirimKeRole(
            'admin',
            'Laporan Harian Baru Menunggu Review',
            "{$peserta->mahasiswa->user->name} mengirim laporan \"{$laporan->judul}\" untuk direview.",
            'review-laporan'
        );

        return new LaporanHarianResource($laporan);
    }

    /** Admin: review laporan harian peserta. */
    public function review(ReviewLaporanHarianRequest $request, LaporanHarian $laporanHarian)
    {
        $laporanHarian->update($request->validated());

        $penerima = $laporanHarian->pesertaMagang->mahasiswa->user;
        $data = $request->validated();
        if ($data['status'] === 'perlu-revisi') {
            Notifikasi::kirim($penerima, 'Laporan Perlu Direvisi', "Laporan \"{$laporanHarian->judul}\" perlu direvisi. " . ($data['catatan_pembimbing'] ?? ''), halaman: 'laporan-peserta');
        } elseif (!empty($data['catatan_pembimbing'])) {
            Notifikasi::kirim($penerima, 'Admin Memberikan Komentar', "Komentar untuk laporan \"{$laporanHarian->judul}\": {$data['catatan_pembimbing']}", halaman: 'laporan-peserta');
        }

        return new LaporanHarianResource($laporanHarian);
    }

    /** Peserta: revisi ulang laporan yang diminta admin untuk direvisi. */
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

        Notifikasi::kirimKeRole(
            'admin',
            'Peserta Merevisi Laporan',
            "{$peserta->mahasiswa->user->name} mengirim revisi untuk laporan \"{$laporanHarian->judul}\".",
            'review-laporan'
        );

        return new LaporanHarianResource($laporanHarian);
    }
}
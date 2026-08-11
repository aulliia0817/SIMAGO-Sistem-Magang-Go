<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RekomendasiResource;
use App\Models\Notifikasi;
use App\Models\PesertaMagang;
use Illuminate\Http\Request;

class RekomendasiController extends Controller
{
    /** Admin: riwayat rekomendasi/penilaian untuk satu peserta. */
    public function index(PesertaMagang $pesertaMagang)
    {
        return RekomendasiResource::collection($pesertaMagang->rekomendasis()->get());
    }

    /** Admin: beri rekomendasi/penilaian kelulusan peserta. */
    public function store(Request $request, PesertaMagang $pesertaMagang)
    {
        $data = $request->validate([
            'kedisiplinan' => ['required', 'integer', 'min:1', 'max:5'],
            'teknis' => ['required', 'integer', 'min:1', 'max:5'],
            'sikap' => ['required', 'integer', 'min:1', 'max:5'],
            'inisiatif' => ['required', 'integer', 'min:1', 'max:5'],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ]);

        $rekomendasi = $pesertaMagang->rekomendasis()->create($data);

        $pesertaMagang->update(['status' => 'selesai']);

        Notifikasi::kirim(
            $pesertaMagang->mahasiswa->user,
            'Rekomendasi Kelulusan Diterbitkan',
            'Admin telah memberikan rekomendasi kelulusan magang. Sertifikat akan segera diterbitkan.',
            halaman: 'sertifikat-peserta'
        );

        return new RekomendasiResource($rekomendasi);
    }
}
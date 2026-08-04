<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RekomendasiResource;
use App\Models\Notifikasi;
use App\Models\PesertaMagang;
use Illuminate\Http\Request;

class RekomendasiController extends Controller
{
    /** Admin/Pembimbing: riwayat rekomendasi/penilaian untuk satu peserta. */
    public function index(PesertaMagang $pesertaMagang)
    {
        return RekomendasiResource::collection(
            $pesertaMagang->rekomendasis()->with('pembimbing.user')->get()
        );
    }

    /** Pembimbing: beri rekomendasi/penilaian kelulusan untuk peserta bimbingan. */
    public function store(Request $request, PesertaMagang $pesertaMagang)
    {
        $user = $request->user();
        abort_unless(
            $user->role === 'admin' || $pesertaMagang->pembimbing_id === $user->pembimbing?->id,
            403,
            'Anda tidak memiliki akses untuk memberi rekomendasi peserta ini.'
        );

        $data = $request->validate([
            'kedisiplinan' => ['required', 'integer', 'min:1', 'max:5'],
            'teknis' => ['required', 'integer', 'min:1', 'max:5'],
            'sikap' => ['required', 'integer', 'min:1', 'max:5'],
            'inisiatif' => ['required', 'integer', 'min:1', 'max:5'],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ]);

        $rekomendasi = $pesertaMagang->rekomendasis()->create($data + [
            'pembimbing_id' => $user->pembimbing?->id,
        ]);

        $pesertaMagang->update(['status' => 'selesai']);

        Notifikasi::kirim(
            $pesertaMagang->mahasiswa->user,
            'Rekomendasi Kelulusan Diterbitkan',
            'Pembimbing Anda telah memberikan rekomendasi kelulusan magang. Admin akan menerbitkan sertifikat.',
            halaman: 'sertifikat-peserta'
        );

        return new RekomendasiResource($rekomendasi->load('pembimbing.user'));
    }
}
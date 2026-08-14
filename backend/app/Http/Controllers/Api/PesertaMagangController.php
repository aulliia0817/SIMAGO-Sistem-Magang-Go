<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PesertaMagangResource;
use App\Models\PesertaMagang;
use Illuminate\Http\Request;

class PesertaMagangController extends Controller
{
    /** Admin: semua peserta magang. */
    public function index(Request $request)
    {
        $query = PesertaMagang::with(['mahasiswa.user', 'divisi']);

        if ($divisiId = $request->query('divisi_id')) {
            $query->where('divisi_id', $divisiId);
        }

        if ($status = $request->query('status')) {
            if ($status !== 'semua') {
                $query->where('status', $status);
            }
        }

        return PesertaMagangResource::collection($query->latest()->get());
    }

    public function show(PesertaMagang $pesertaMagang)
    {
        return new PesertaMagangResource($pesertaMagang->load(['mahasiswa.user', 'divisi']));
    }

    /** Admin: ubah divisi/periode/status peserta. */
    public function update(Request $request, PesertaMagang $pesertaMagang)
    {
        $data = $request->validate([
            'divisi_id' => ['sometimes', 'exists:divisis,id'],
            'status' => ['sometimes', 'in:aktif,selesai,diberhentikan'],
        ]);

        $pesertaMagang->update($data);

        return new PesertaMagangResource($pesertaMagang->load(['mahasiswa.user', 'divisi']));
    }

    /** Peserta: data magang milik sendiri. */
    public function mine(Request $request)
    {
        $peserta = $request->user()->mahasiswa?->pesertaMagang;

        abort_unless($peserta, 404, 'Anda belum menjadi peserta magang aktif.');

        return new PesertaMagangResource($peserta->load(['mahasiswa.user', 'divisi']));
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PesertaMagangResource;
use App\Models\Pendaftaran;
use App\Models\PesertaMagang;
use Illuminate\Http\Request;

class PesertaMagangController extends Controller
{
    /** Admin: tempatkan pendaftar yang sudah disetujui ke divisi & periode magang. */
    public function store(Request $request)
    {
        $data = $request->validate([
            'pendaftaran_id' => ['required', 'exists:pendaftarans,id'],
            'divisi_id' => ['required', 'exists:divisis,id'],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after:tanggal_mulai'],
        ]);

        $pendaftaran = Pendaftaran::findOrFail($data['pendaftaran_id']);
        abort_if($pendaftaran->status !== 'disetujui', 422, 'Pendaftaran belum disetujui.');
        abort_if((bool) $pendaftaran->pesertaMagang, 422, 'Pendaftaran ini sudah ditempatkan.');

        $peserta = PesertaMagang::create([
            'pendaftaran_id' => $pendaftaran->id,
            'mahasiswa_id' => $pendaftaran->mahasiswa_id,
            'divisi_id' => $data['divisi_id'],
            'tanggal_mulai' => $data['tanggal_mulai'],
            'tanggal_selesai' => $data['tanggal_selesai'],
            'status' => 'aktif',
        ]);

        $pendaftaran->mahasiswa->user()->update(['role' => 'peserta']);

        return new PesertaMagangResource($peserta->load(['mahasiswa.user', 'divisi']));
    }

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
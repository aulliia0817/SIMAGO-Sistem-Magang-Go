<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewDokumenRequest;
use App\Http\Requests\UploadDokumenRequest;
use App\Http\Resources\DokumenResource;
use App\Models\Dokumen;
use Illuminate\Http\Request;

class DokumenController extends Controller
{
    /** Calon/Peserta: daftar dokumen milik pendaftaran sendiri. */
    public function mine(Request $request)
    {
        $pendaftaran = $request->user()->mahasiswa?->pendaftarans()->latest()->first();

        if (! $pendaftaran) {
            return response()->json(['message' => 'Belum ada pendaftaran.'], 404);
        }

        return DokumenResource::collection($pendaftaran->dokumens);
    }

    /** Calon/Peserta: upload/ganti file untuk satu jenis dokumen. */
    public function upload(UploadDokumenRequest $request, Dokumen $dokumen)
    {
        $this->authorizeOwnership($request, $dokumen);

        $path = $request->file('file')->store('dokumen', 'public');

        $dokumen->update([
            'file_path' => $path,
            'file_name' => $request->file('file')->getClientOriginalName(),
            'status' => 'menunggu',
            'catatan' => null,
        ]);

        return new DokumenResource($dokumen);
    }

    /** Admin: daftar seluruh dokumen yang perlu diverifikasi (halaman Verifikasi Berkas). */
    public function index(Request $request)
    {
        $query = Dokumen::with('pendaftaran.mahasiswa.user');

        if ($status = $request->query('status')) {
            if ($status !== 'semua') {
                $query->where('status', $status);
            }
        }

        return DokumenResource::collection($query->latest()->paginate($request->integer('per_page', 20)));
    }

    /** Admin: verifikasi / tolak satu dokumen. */
    public function review(ReviewDokumenRequest $request, Dokumen $dokumen)
    {
        $dokumen->update($request->validated());

        return new DokumenResource($dokumen);
    }

    protected function authorizeOwnership(Request $request, Dokumen $dokumen): void
    {
        $ownerId = $dokumen->pendaftaran->mahasiswa->user_id ?? null;

        abort_unless($ownerId === $request->user()->id, 403, 'Anda tidak memiliki akses ke dokumen ini.');
    }
}

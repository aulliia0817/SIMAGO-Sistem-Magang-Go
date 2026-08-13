<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePengumumanRequest;
use App\Http\Resources\PengumumanResource;
use App\Models\Notifikasi;
use App\Models\Pengumuman;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PengumumanController extends Controller
{
    public function index(Request $request)
    {
        $query = Pengumuman::with('creator');

        $status = $request->query('status');
        if ($status && $status !== 'semua') {
            $query->where('status', $status);
        }

        return PengumumanResource::collection($query->latest()->get());
    }
    public function store(StorePengumumanRequest $request)
    {
        $pengumuman = Pengumuman::create([
            ...$request->validated(),
            'status' => 'aktif',
            'created_by' => $request->user()->id,
        ]);

        Notifikasi::kirimKeRole(
            'peserta',
            'Pengumuman Baru: ' . $pengumuman->judul,
            Str::limit($pengumuman->isi, 120),
            halaman: 'dashboard',
        );

        return new PengumumanResource($pengumuman->load('creator'));
    }
    public function archive(Pengumuman $pengumuman)
    {
        $pengumuman->arsipkan();

        return new PengumumanResource($pengumuman->load('creator'));
    }
    public function reactivate(Pengumuman $pengumuman)
    {
        $pengumuman->aktifkanKembali();

        return new PengumumanResource($pengumuman->load('creator'));
    }
    public function destroy(Pengumuman $pengumuman)
    {
        if ($pengumuman->status !== 'diarsipkan') {
            return response()->json([
                'message' => 'Hanya pengumuman yang sudah diarsipkan yang dapat dihapus.',
            ], 422);
        }

        $pengumuman->delete();

        return response()->json(['message' => 'Pengumuman berhasil dihapus.']);
    }
    public function aktif()
    {
        return PengumumanResource::collection(
            Pengumuman::where('status', 'aktif')->oldest()->get()
        );
    }
}

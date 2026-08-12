<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePengumumanRequest;
use App\Http\Resources\PengumumanResource;
use App\Models\Pengumuman;
use App\Models\Notifikasi;
use Illuminate\Http\Request;

class PengumumanController extends Controller
{
    public function index(Request $request)
    {
        $query = Pengumuman::with('creator')->latest();

        if ($status = $request->query('status')) {
            if (in_array($status, ['aktif', 'diarsipkan'], true)) {
                $query->where('status', $status);
            }
        }

        return PengumumanResource::collection($query->get());
    }
        public function store(StorePengumumanRequest $request)
    {
        $pengumuman = Pengumuman::create([
            'judul' => $request->validated('judul'),
            'isi' => $request->validated('isi'),
            'status' => 'aktif',
            'created_by' => $request->user()->id,
        ]);

        Notifikasi::kirimKeRole(
            'peserta',
            'Pengumuman',
            $pengumuman->judul . ': ' . $pengumuman->isi,
            'dashboard'
        );

        return new PengumumanResource($pengumuman->load('creator'));
    }
        public function archive(Pengumuman $pengumuman)
    {
        $pengumuman->update([
            'status' => 'diarsipkan',
            'archived_at' => now(),
        ]);

        return new PengumumanResource($pengumuman->load('creator'));
    }
    public function aktif()
    {
        $pengumuman = Pengumuman::aktif()->latest()->get();

        return PengumumanResource::collection($pengumuman);
    }
}

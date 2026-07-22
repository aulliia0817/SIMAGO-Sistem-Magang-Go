<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengaturan;
use Illuminate\Http\Request;

class PengaturanController extends Controller
{
    /** Publik: dicek frontend (dashboard admin & form pendaftaran calon) untuk tahu status periode. */
    public function periode()
    {
        return response()->json([
            'dibuka' => Pengaturan::bool('periode_pendaftaran_dibuka', true),
        ]);
    }

    /** Admin: buka/tutup periode pendaftaran magang. */
    public function updatePeriode(Request $request)
    {
        $data = $request->validate([
            'dibuka' => ['required', 'boolean'],
        ]);

        Pengaturan::set('periode_pendaftaran_dibuka', $data['dibuka'] ? '1' : '0');

        return response()->json(['dibuka' => $data['dibuka']]);
    }
}

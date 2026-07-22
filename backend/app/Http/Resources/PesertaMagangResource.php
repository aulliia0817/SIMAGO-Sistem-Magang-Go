<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PesertaMagangResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $totalHari = $this->tanggal_mulai && $this->tanggal_selesai
            ? $this->tanggal_mulai->diffInWeekdays($this->tanggal_selesai)
            : 0;
        $hariBerjalan = $this->tanggal_mulai
            ? max(0, min($totalHari, now()->diffInWeekdays($this->tanggal_mulai)))
            : 0;

        return [
            'id' => $this->id,
            'nama' => $this->mahasiswa->user->name ?? '-',
            'divisi' => $this->divisi->nama ?? '-',
            'divisi_id' => $this->divisi_id,
            'pembimbing' => $this->pembimbing->user->name ?? '-',
            'pembimbing_id' => $this->pembimbing_id,
            'tanggal_mulai' => optional($this->tanggal_mulai)->format('d M Y'),
            'tanggal_selesai' => optional($this->tanggal_selesai)->format('d M Y'),
            'hari_berjalan' => $hariBerjalan,
            'total_hari' => $totalHari,
            'hadir' => $this->absensis()->where('status', 'hadir')->count(),
            'total_absensi' => $this->absensis()->count(),
            'persen' => $this->persen_kehadiran,
            'status' => $this->status,
        ];
    }
}

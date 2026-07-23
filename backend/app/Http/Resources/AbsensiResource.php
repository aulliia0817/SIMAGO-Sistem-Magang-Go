<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AbsensiResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'peserta_magang_id' => $this->peserta_magang_id,
            'nama' => $this->pesertaMagang->mahasiswa->user->name ?? '-',
            'divisi' => $this->pesertaMagang->divisi->nama ?? '-',
            'tanggal' => optional($this->tanggal)->format('d M Y'),
            'jam_masuk' => $this->jam_masuk ? substr($this->jam_masuk, 0, 5) : null,
            'jam_keluar' => $this->jam_keluar ? substr($this->jam_keluar, 0, 5) : null,
            'status' => $this->status,
            'diverifikasi' => $this->diverifikasi,
        ];
    }
}

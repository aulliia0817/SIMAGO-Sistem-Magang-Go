<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
            'hari' => optional($this->tanggal)->translatedFormat('l'),
            'jam_masuk' => $this->jam_masuk,
            'jam_keluar' => $this->jam_keluar,
            'status' => $this->status,
            'sift' => $this->sift,
            'keterangan' => $this->keterangan,
            'bukti_url' => $this->bukti_path ? Storage::disk('public')->url($this->bukti_path) : null,
            'di_luar_jam' => (bool) $this->di_luar_jam,
            'diverifikasi' => $this->diverifikasi,
        ];
    }
}

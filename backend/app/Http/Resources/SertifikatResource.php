<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SertifikatResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'peserta_magang_id' => $this->peserta_magang_id,
            'nama' => $this->pesertaMagang->mahasiswa->user->name ?? '-',
            'divisi' => $this->pesertaMagang->divisi->nama ?? '-',
            'nomor' => $this->nomor,
            'status' => $this->status,
            'tanggal_terbit' => optional($this->tanggal_terbit)->format('d M Y'),
            'file_url' => $this->file_path ? \Storage::disk('public')->url($this->file_path) : null,
        ];
    }
}

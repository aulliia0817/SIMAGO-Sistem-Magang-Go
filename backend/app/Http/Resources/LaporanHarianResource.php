<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LaporanHarianResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'peserta_magang_id' => $this->peserta_magang_id,
            'peserta' => $this->pesertaMagang->mahasiswa->user->name ?? '-',
            'judul' => $this->judul,
            'tanggal' => optional($this->tanggal)->format('d M Y'),
            'isi' => $this->isi,
            'status' => $this->status,
            'catatan_pembimbing' => $this->catatan_pembimbing,
        ];
    }
}

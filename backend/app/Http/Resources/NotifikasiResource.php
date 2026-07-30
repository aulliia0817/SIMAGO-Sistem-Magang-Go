<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotifikasiResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'judul' => $this->judul,
            'pesan' => $this->pesan,
            'halaman' => $this->halaman,
            'pendaftaran_id' => $this->pendaftaran_id,
            'dibaca' => $this->dibaca,
            'waktu' => $this->created_at->locale('id')->diffForHumans(),
            'tanggal' => $this->created_at->format('d M Y, H:i'),
        ];
    }
}
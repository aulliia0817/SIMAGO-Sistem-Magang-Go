<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PengumumanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'judul' => $this->judul,
            'isi' => $this->isi,
            'status' => $this->status,
            'dibuat_oleh' => $this->creator->name ?? '-',
            'dibuat_pada' => $this->created_at?->translatedFormat('d F Y'),
            'diarsipkan_pada' => $this->archived_at
                ? $this->archived_at->translatedFormat('d F Y')
                : null,
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PembimbingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama' => $this->user->name ?? '-',
            'email' => $this->user->email ?? '-',
            'nip' => $this->nip,
            'divisi' => $this->divisi->nama ?? '-',
            'divisi_id' => $this->divisi_id,
            'peserta' => $this->pesertaMagangs()->where('status', 'aktif')->count(),
            'status' => $this->status,
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PendaftaranResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama' => $this->mahasiswa->user->name ?? '-',
            'institusi' => $this->mahasiswa->institusi ?? '-',
            'jurusan' => $this->mahasiswa->jurusan ?? '-',
            'divisi' => $this->divisi->nama ?? '-',
            'divisi_id' => $this->divisi_id,
            'periode' => $this->periode,
            'motivasi' => $this->motivasi,
            'tanggal' => optional($this->created_at)->format('d M Y'),
            'status' => $this->status,
            'catatan_admin' => $this->catatan_admin,
            'sudah_ditempatkan' => $this->relationLoaded('pesertaMagang') ? $this->pesertaMagang !== null : null,
            'dokumen' => DokumenResource::collection($this->whenLoaded('dokumens')),
        ];
    }
}

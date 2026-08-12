<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PendaftaranResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $batasPengumuman = $this->created_at?->copy()->addDays(14);

        return [
            'id' => $this->id,
            'nama' => $this->mahasiswa->user->name ?? '-',
            'institusi' => $this->mahasiswa->institusi ?? '-',
            'jurusan' => $this->mahasiswa->jurusan ?? '-',
            'no_hp' => $this->mahasiswa->no_hp ?? '-',
            'divisi' => $this->divisi->nama ?? '-',
            'divisi_id' => $this->divisi_id,
            'periode' => $this->periode,
            'motivasi' => $this->motivasi,
            'tanggal' => optional($this->created_at)->format('d M Y'),
            'batas_pengumuman' => optional($batasPengumuman)->translatedFormat('d M Y'),
            'sisa_hari_pengumuman' => $batasPengumuman
                ? ($batasPengumuman->isPast() ? 0 : now()->startOfDay()->diffInDays($batasPengumuman->copy()->startOfDay()))
                : null,
            'status' => $this->status,
            'catatan_admin' => $this->catatan_admin,
            'dokumen_dikirim' => $this->dokumen_dikirim_at !== null,
            'sudah_ditempatkan' => $this->relationLoaded('pesertaMagang') ? $this->pesertaMagang !== null : null,
            'dokumen' => DokumenResource::collection($this->whenLoaded('dokumens')),
        ];
    }
}
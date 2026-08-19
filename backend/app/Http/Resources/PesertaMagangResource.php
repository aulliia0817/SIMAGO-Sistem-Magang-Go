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

        // diffInWeekdays() itu jarak MUTLAK (tidak peduli arah), jadi kalau
        // dipakai langsung, periode yang belum dimulai pun bisa kehitung
        // "sudah jalan sekian hari". Makanya di sini dicek dulu posisi hari
        // ini relatif terhadap periode sebelum dihitung jaraknya.
        $hariBerjalan = 0;
        if ($this->tanggal_mulai && $this->tanggal_selesai) {
            if (now()->lt($this->tanggal_mulai)) {
                $hariBerjalan = 0; // periode belum dimulai
            } elseif (now()->gt($this->tanggal_selesai)) {
                $hariBerjalan = $totalHari; // periode sudah selesai
            } else {
                $hariBerjalan = $this->tanggal_mulai->diffInWeekdays(now());
            }
        }

        return [
            'id' => $this->id,
            'nama' => $this->mahasiswa->user->name ?? '-',
            'institusi' => $this->mahasiswa->institusi ?? '-',
            'divisi' => $this->divisi->nama ?? '-',
            'divisi_id' => $this->divisi_id,
            'tanggal_mulai' => optional($this->tanggal_mulai)->format('d M Y'),
            'tanggal_selesai' => optional($this->tanggal_selesai)->format('d M Y'),
            'tanggal_mulai_iso' => optional($this->tanggal_mulai)->format('Y-m-d'),
            'tanggal_selesai_iso' => optional($this->tanggal_selesai)->format('Y-m-d'),
            'hari_berjalan' => $hariBerjalan,
            'total_hari' => $totalHari,
            'hadir' => $this->absensis()->where('status', 'hadir')->count(),
            'total_absensi' => $this->absensis()->count(),
            'persen' => $this->persen_kehadiran,
            'status' => $this->status,
        ];
    }
}
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RekomendasiResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'pembimbing' => $this->pembimbing->user->name ?? '-',
            'kedisiplinan' => $this->kedisiplinan,
            'teknis' => $this->teknis,
            'sikap' => $this->sikap,
            'inisiatif' => $this->inisiatif,
            'rata_rata' => round(($this->kedisiplinan + $this->teknis + $this->sikap + $this->inisiatif) / 4, 1),
            'catatan' => $this->catatan,
            'tanggal' => optional($this->created_at)->format('d M Y'),
        ];
    }
}
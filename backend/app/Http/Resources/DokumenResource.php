<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DokumenResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'pendaftaran_id' => $this->pendaftaran_id,
            'nama' => $this->jenis,
            'status' => $this->status,
            'catatan' => $this->catatan,
            'file_url' => $this->file_path ? \Storage::disk('public')->url($this->file_path) : null,
            'file_name' => $this->file_name,
        ];
    }
}

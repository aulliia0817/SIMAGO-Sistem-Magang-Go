<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'status_magang' => $this->role === 'peserta' ? 'peserta' : ($this->role === 'calon' ? 'calon' : null),
        ];
    }
}

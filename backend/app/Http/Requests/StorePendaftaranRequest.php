<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePendaftaranRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:150'],
            'nim' => ['required', 'string', 'max:50'],
            'tanggal_lahir' => ['nullable', 'date'],
            'no_hp' => ['nullable', 'string', 'max:20'],
            'institusi' => ['required', 'string', 'max:150'],
            'jurusan' => ['required', 'string', 'max:150'],
            'semester' => ['nullable', 'string', 'max:10'],
            'periode' => ['required', 'string', 'max:100'],
            'divisi_id' => ['required', 'exists:divisis,id'],
            'motivasi' => ['nullable', 'string'],
        ];
    }
}

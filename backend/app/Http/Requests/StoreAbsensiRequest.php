<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAbsensiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:hadir,izin,sakit,alpha'],
            'jam_masuk' => ['nullable', 'date_format:H:i'],
            'jam_keluar' => ['nullable', 'date_format:H:i'],
        ];
    }
}

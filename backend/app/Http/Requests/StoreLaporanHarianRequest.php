<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLaporanHarianRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'judul' => ['required', 'string', 'max:200'],
            'tanggal' => ['required', 'date'],
            'isi' => ['required', 'string'],
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewLaporanHarianRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:selesai,perlu-revisi'],
            'catatan_pembimbing' => ['nullable', 'string'],
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewDokumenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:terverifikasi,ditolak'],
            'catatan' => ['nullable', 'required_if:status,ditolak', 'string'],
        ];
    }
}

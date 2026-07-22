<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadDokumenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'jenis' => ['required', 'string', 'max:150'],
            'file' => ['required', 'file', 'mimes:pdf,docx,jpg,jpeg,png', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.mimes' => 'Format file harus PDF, DOCX, JPG, atau PNG.',
            'file.max' => 'Ukuran file maksimal 5MB.',
        ];
    }
}

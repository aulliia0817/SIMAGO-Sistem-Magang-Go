<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePembimbingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'nip' => ['required', 'string', 'max:50', 'unique:pembimbings,nip'],
            'divisi_id' => ['required', 'exists:divisis,id'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
        ];
    }
}

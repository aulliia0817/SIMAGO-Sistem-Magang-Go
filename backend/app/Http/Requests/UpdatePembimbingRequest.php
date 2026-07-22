<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePembimbingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $pembimbingId = $this->route('pembimbing')?->id;

        return [
            'nama' => ['sometimes', 'required', 'string', 'max:150'],
            'email' => ['sometimes', 'required', 'email', 'unique:users,email,'.optional($this->route('pembimbing')?->user)->id],
            'nip' => ['sometimes', 'required', 'string', 'max:50', 'unique:pembimbings,nip,'.$pembimbingId],
            'divisi_id' => ['sometimes', 'required', 'exists:divisis,id'],
            'status' => ['sometimes', 'in:aktif,nonaktif'],
        ];
    }
}

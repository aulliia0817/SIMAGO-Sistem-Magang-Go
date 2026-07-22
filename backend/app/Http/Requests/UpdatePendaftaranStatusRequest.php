<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePendaftaranStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Seleksi (Loloskan/Tolak) only changes status — no extra form on that page.
            // Assigning a pembimbing/period happens afterwards on the Penempatan page.
            'status' => ['required', 'in:menunggu,disetujui,ditolak'],
            'catatan_admin' => ['nullable', 'string'],
        ];
    }
}

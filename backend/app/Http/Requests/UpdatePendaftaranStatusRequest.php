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
            // Verifikasi berkas + seleksi + penerbitan surat balasan sekarang
            // jadi satu langkah di halaman Verifikasi Berkas: begitu admin
            // memutuskan diterima/ditolak, nomor surat wajib diisi karena
            // langsung dipakai untuk membuat PDF surat balasannya.
            'status' => ['required', 'in:menunggu,disetujui,ditolak'],
            'catatan_admin' => ['nullable', 'string'],
        ];
    }
}
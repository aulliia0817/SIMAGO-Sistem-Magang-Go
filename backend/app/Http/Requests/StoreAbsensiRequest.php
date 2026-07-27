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
            // 'datang' & 'pulang' = check-in/check-out normal.
            // 'izin', 'sakit', 'lupa_absen' = pengajuan dengan keterangan + bukti wajib.
            'sift' => ['required', 'in:datang,pulang,izin,sakit,lupa_absen'],
            'keterangan' => ['required_if:sift,izin,sakit,lupa_absen', 'nullable', 'string', 'max:2000'],
            'bukti' => [
                'required_if:sift,izin,sakit,lupa_absen',
                'nullable',
                'file',
                'mimes:pdf,jpg,jpeg,png,mp4,mov,webm',
                'max:20480',
            ],
            'jam_masuk' => ['nullable', 'date_format:H:i'],
            'jam_keluar' => ['nullable', 'date_format:H:i'],
            'di_luar_jam' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'keterangan.required_if' => 'Keterangan wajib diisi untuk Izin, Sakit, atau Lupa Absen.',
            'bukti.required_if' => 'Dokumen pendukung wajib diunggah untuk Izin, Sakit, atau Lupa Absen.',
            'bukti.mimes' => 'Dokumen pendukung harus berupa PDF, gambar, atau video.',
            'bukti.max' => 'Ukuran dokumen pendukung maksimal 20MB.',
        ];
    }
}

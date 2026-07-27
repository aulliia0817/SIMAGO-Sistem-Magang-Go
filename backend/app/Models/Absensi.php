<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Absensi extends Model
{
    use HasFactory;

    protected $fillable = [
        'peserta_magang_id', 'tanggal', 'jam_masuk', 'jam_keluar', 'status',
        'sift', 'keterangan', 'bukti_path', 'di_luar_jam', 'diverifikasi',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'diverifikasi' => 'boolean',
        ];
    }

    public function pesertaMagang()
    {
        return $this->belongsTo(PesertaMagang::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sertifikat extends Model
{
    use HasFactory;

    protected $fillable = [
        'peserta_magang_id', 'nomor', 'file_path', 'status', 'tanggal_terbit',
    ];

    protected function casts(): array
    {
        return ['tanggal_terbit' => 'date'];
    }

    public function pesertaMagang()
    {
        return $this->belongsTo(PesertaMagang::class);
    }
}

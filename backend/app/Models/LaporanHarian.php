<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LaporanHarian extends Model
{
    use HasFactory;

    protected $fillable = [
        'peserta_magang_id', 'judul', 'tanggal', 'isi', 'status', 'catatan_pembimbing',
    ];

    protected function casts(): array
    {
        return ['tanggal' => 'date'];
    }

    public function pesertaMagang()
    {
        return $this->belongsTo(PesertaMagang::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pendaftaran extends Model
{
    use HasFactory;

    protected $fillable = [
        'mahasiswa_id', 'divisi_id', 'periode', 'tanggal_mulai', 'tanggal_selesai',
        'motivasi', 'status', 'catatan_admin',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
        ];
    }

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function divisi()
    {
        return $this->belongsTo(Divisi::class);
    }

    public function dokumens()
    {
        return $this->hasMany(Dokumen::class);
    }

    public function pesertaMagang()
    {
        return $this->hasOne(PesertaMagang::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PesertaMagang extends Model
{
    use HasFactory;

    protected $fillable = [
        'pendaftaran_id', 'mahasiswa_id', 'divisi_id', 'pembimbing_id',
        'tanggal_mulai', 'tanggal_selesai', 'status',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
        ];
    }

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class);
    }

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function divisi()
    {
        return $this->belongsTo(Divisi::class);
    }

    public function pembimbing()
    {
        return $this->belongsTo(Pembimbing::class);
    }

    public function absensis()
    {
        return $this->hasMany(Absensi::class);
    }

    public function laporanHarians()
    {
        return $this->hasMany(LaporanHarian::class);
    }

    public function sertifikat()
    {
        return $this->hasOne(Sertifikat::class);
    }

    public function getPersenKehadiranAttribute(): int
    {
        $total = $this->absensis()->count();
        if ($total === 0) {
            return 0;
        }
        $hadir = $this->absensis()->where('status', 'hadir')->count();

        return (int) round(($hadir / $total) * 100);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Divisi extends Model
{
    use HasFactory;

    protected $fillable = ['nama', 'kuota'];

    public function pembimbings()
    {
        return $this->hasMany(Pembimbing::class);
    }

    public function pendaftarans()
    {
        return $this->hasMany(Pendaftaran::class);
    }

    public function pesertaMagangs()
    {
        return $this->hasMany(PesertaMagang::class);
    }

    /** Sisa kuota = kuota - jumlah peserta magang aktif di divisi ini */
    public function getSisaKuotaAttribute(): int
    {
        return max(0, $this->kuota - $this->pesertaMagangs()->where('status', 'aktif')->count());
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rekomendasi extends Model
{
    protected $fillable = [
        'peserta_magang_id',
        'pembimbing_id',
        'kedisiplinan',
        'teknis',
        'sikap',
        'inisiatif',
        'catatan',
    ];

    public function pesertaMagang()
    {
        return $this->belongsTo(PesertaMagang::class);
    }

    public function pembimbing()
    {
        return $this->belongsTo(Pembimbing::class);
    }
}
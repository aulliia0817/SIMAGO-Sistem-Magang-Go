<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mahasiswa extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'nim', 'tanggal_lahir', 'no_hp', 'institusi', 'jurusan', 'semester',
    ];

    protected function casts(): array
    {
        return ['tanggal_lahir' => 'date'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pendaftarans()
    {
        return $this->hasMany(Pendaftaran::class);
    }

    public function pesertaMagang()
    {
        return $this->hasOne(PesertaMagang::class)->latestOfMany();
    }
}

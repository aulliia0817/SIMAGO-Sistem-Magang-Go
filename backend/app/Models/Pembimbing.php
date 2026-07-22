<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pembimbing extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'divisi_id', 'nip', 'status'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function divisi()
    {
        return $this->belongsTo(Divisi::class);
    }

    public function pesertaMagangs()
    {
        return $this->hasMany(PesertaMagang::class);
    }
}

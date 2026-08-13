<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pengumuman extends Model
{
    use HasFactory;
    protected $table = 'pengumumans';

    protected $fillable = [
        'judul',
        'isi',
        'status',
        'created_by',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'archived_at' => 'datetime',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function arsipkan(): void
    {
        $this->update([
            'status' => 'diarsipkan',
            'archived_at' => now(),
        ]);
    }
    public function aktifkanKembali(): void
    {
        $this->update([
            'status' => 'aktif',
            'archived_at' => null,
        ]);
    }
}

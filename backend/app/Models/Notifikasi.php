<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notifikasi extends Model
{
    protected $fillable = ['user_id', 'judul', 'pesan', 'halaman', 'dibaca', 'dedupe_key'];

    protected function casts(): array
    {
        return ['dibaca' => 'boolean'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function kirim(User $user, string $judul, string $pesan, ?string $dedupeKey = null, ?string $halaman = null): void
    {
        if ($dedupeKey) {
            static::firstOrCreate(
                ['user_id' => $user->id, 'dedupe_key' => $dedupeKey],
                ['judul' => $judul, 'pesan' => $pesan, 'halaman' => $halaman]
            );

            return;
        }

        static::create([
            'user_id' => $user->id,
            'judul' => $judul,
            'pesan' => $pesan,
            'halaman' => $halaman,
        ]);
    }

    public static function kirimKeRole(string $role, string $judul, string $pesan, ?string $halaman = null): void
    {
        User::where('role', $role)->get()->each(
            fn(User $u) => static::kirim($u, $judul, $pesan, halaman: $halaman)
        );
    }

    public static function kirimKeSemuaAdminDedup(string $judul, string $pesan, string $dedupeKey, ?string $halaman = null): void
    {
        User::where('role', 'admin')->get()->each(
            fn(User $u) => static::kirim($u, $judul, $pesan, $dedupeKey, $halaman)
        );
    }
}
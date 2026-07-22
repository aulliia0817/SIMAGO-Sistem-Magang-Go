<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pengaturan extends Model
{
    protected $fillable = ['key', 'value'];

    public static function get(string $key, ?string $default = null): ?string
    {
        return static::where('key', $key)->value('value') ?? $default;
    }

    public static function set(string $key, string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    public static function bool(string $key, bool $default = true): bool
    {
        $raw = static::get($key, $default ? '1' : '0');

        return $raw === '1';
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('absensis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('peserta_magang_id')->constrained()->cascadeOnDelete();
            $table->date('tanggal');
            $table->time('jam_masuk')->nullable();
            $table->time('jam_keluar')->nullable();
            $table->enum('status', ['hadir', 'izin', 'sakit', 'alpha'])->default('hadir');
            $table->boolean('diverifikasi')->default(false);
            $table->timestamps();

            $table->unique(['peserta_magang_id', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('absensis');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('peserta_magangs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftaran_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mahasiswa_id')->constrained();
            $table->foreignId('divisi_id')->constrained('divisis');
            $table->foreignId('pembimbing_id')->nullable()->constrained('pembimbings')->nullOnDelete();
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->enum('status', ['aktif', 'selesai', 'diberhentikan'])->default('aktif');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peserta_magangs');
    }
};

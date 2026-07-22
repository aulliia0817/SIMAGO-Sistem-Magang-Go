<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dokumens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftaran_id')->constrained()->cascadeOnDelete();
            // CV | Surat Pengantar Kampus | Surat Pengantar Kesbangpol | Transkrip Nilai | KTM | Pas Foto
            $table->string('jenis');
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->enum('status', ['belum-upload', 'menunggu', 'terverifikasi', 'ditolak'])->default('belum-upload');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dokumens');
    }
};

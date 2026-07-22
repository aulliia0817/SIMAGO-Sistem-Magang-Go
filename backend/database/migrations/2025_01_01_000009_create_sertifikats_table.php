<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sertifikats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('peserta_magang_id')->constrained()->cascadeOnDelete();
            $table->string('nomor')->unique();
            $table->string('file_path')->nullable();
            $table->enum('status', ['proses', 'terbit'])->default('proses');
            $table->date('tanggal_terbit')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sertifikats');
    }
};

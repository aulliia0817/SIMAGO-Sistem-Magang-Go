<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laporan_harians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('peserta_magang_id')->constrained()->cascadeOnDelete();
            $table->string('judul');
            $table->date('tanggal');
            $table->longText('isi');
            $table->enum('status', ['belum-review', 'perlu-revisi', 'selesai'])->default('belum-review');
            $table->text('catatan_pembimbing')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('laporan_harians');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pendaftarans', function (Blueprint $table) {
            // Diisi admin saat mengambil keputusan (diterima/ditolak) di halaman
            // Verifikasi Berkas. Begitu diisi, surat balasan (PDF) otomatis
            // dibuat dari template resources/views/surat/keputusan.blade.php
            // dan bisa diunduh calon dari halaman Tracking Status.
            $table->string('nomor_surat')->nullable()->after('dokumen_dikirim_at');
            $table->string('surat_path')->nullable()->after('nomor_surat');
            $table->timestamp('surat_dikirim_at')->nullable()->after('surat_path');
        });
    }

    public function down(): void
    {
        Schema::table('pendaftarans', function (Blueprint $table) {
            $table->dropColumn(['nomor_surat', 'surat_path', 'surat_dikirim_at']);
        });
    }
};
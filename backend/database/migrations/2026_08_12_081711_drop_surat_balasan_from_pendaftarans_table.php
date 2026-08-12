<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pendaftarans', function (Blueprint $table) {
            $table->dropColumn(['nomor_surat', 'surat_path', 'surat_dikirim_at']);
        });
    }

    public function down(): void
    {
        Schema::table('pendaftarans', function (Blueprint $table) {
            $table->string('nomor_surat')->nullable()->after('dokumen_dikirim_at');
            $table->string('surat_path')->nullable()->after('nomor_surat');
            $table->timestamp('surat_dikirim_at')->nullable()->after('surat_path');
        });
    }
};
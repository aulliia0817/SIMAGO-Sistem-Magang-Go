<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pendaftarans', function (Blueprint $table) {
            // Diisi saat calon magang menekan "Kirim Berkas" setelah seluruh
            // dokumen wajib terupload. Selama kolom ini null, dokumen masih
            // bisa diupload/diganti bebas. Setelah terisi, dokumen terkunci
            // (kecuali yang ditolak admin, supaya bisa diperbaiki).
            $table->timestamp('dokumen_dikirim_at')->nullable()->after('catatan_admin');
        });
    }

    public function down(): void
    {
        Schema::table('pendaftarans', function (Blueprint $table) {
            $table->dropColumn('dokumen_dikirim_at');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Perbaiki nama jenis dokumen "Surat Pengantar Kesbangpol" yang sudah
     * terlanjur tersimpan di database (dari pendaftaran-pendaftaran lama),
     * supaya konsisten dengan nama resmi baru: "Surat Pengantar Bakesbangpol
     * Kabupaten Madiun". Pendaftaran baru sudah otomatis pakai nama ini lewat
     * PendaftaranController::store().
     */
    public function up(): void
    {
        DB::table('dokumens')
            ->where('jenis', 'Surat Pengantar Kesbangpol')
            ->update(['jenis' => 'Surat Pengantar Bakesbangpol Kabupaten Madiun']);
    }

    public function down(): void
    {
        DB::table('dokumens')
            ->where('jenis', 'Surat Pengantar Bakesbangpol Kabupaten Madiun')
            ->update(['jenis' => 'Surat Pengantar Kesbangpol']);
    }
};

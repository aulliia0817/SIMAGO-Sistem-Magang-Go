<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Ganti enum status supaya menerima 'kedaluwarsa'. Pendaftaran yang
        // lewat batas pengumuman (14 hari) sekarang DITANDAI kedaluwarsa,
        // bukan dihapus — supaya tetap muncul di Riwayat Pendaftaran calon.
        DB::statement("ALTER TABLE pendaftarans MODIFY status ENUM('menunggu', 'disetujui', 'ditolak', 'kedaluwarsa') NOT NULL DEFAULT 'menunggu'");
    }

    public function down(): void
    {
        DB::table('pendaftarans')->where('status', 'kedaluwarsa')->update(['status' => 'ditolak']);
        DB::statement("ALTER TABLE pendaftarans MODIFY status ENUM('menunggu', 'disetujui', 'ditolak') NOT NULL DEFAULT 'menunggu'");
    }
};
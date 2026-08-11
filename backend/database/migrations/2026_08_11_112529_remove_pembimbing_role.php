<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("UPDATE absensis SET diverifikasi = 1");
        DB::statement("ALTER TABLE absensis MODIFY diverifikasi TINYINT(1) NOT NULL DEFAULT 1");

        Schema::table('peserta_magangs', function (Blueprint $table) {
            $table->dropForeign(['pembimbing_id']);
            $table->dropColumn('pembimbing_id');
        });

        Schema::table('rekomendasis', function (Blueprint $table) {
            $table->dropForeign(['pembimbing_id']);
            $table->dropColumn('pembimbing_id');
        });

        Schema::dropIfExists('pembimbings');

        DB::statement("UPDATE users SET role = 'admin' WHERE role = 'pembimbing'");
        DB::statement("ALTER TABLE users MODIFY role ENUM('admin','calon','peserta') DEFAULT 'calon'");
    }

    public function down(): void
    {
        // Rollback disediakan seadanya — struktur pembimbings tidak direkonstruksi penuh.
        DB::statement("ALTER TABLE users MODIFY role ENUM('admin','calon','peserta','pembimbing') DEFAULT 'calon'");
        DB::statement("ALTER TABLE absensis MODIFY diverifikasi TINYINT(1) NOT NULL DEFAULT 0");
    }
};
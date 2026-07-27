<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('absensis', function (Blueprint $table) {
            // Jenis pengisian: datang / pulang / izin / sakit / lupa_absen.
            // 'status' (hadir/izin/sakit/alpha) tetap dipakai untuk rekap,
            // sedangkan 'sift' menyimpan pilihan asli yang diisi peserta di form.
            $table->string('sift')->nullable()->after('status');
            $table->text('keterangan')->nullable()->after('sift');
            $table->string('bukti_path')->nullable()->after('keterangan');
            // Menandai pengisian yang dilakukan di luar jam datang/pulang yang ditentukan
            // (07:00-08:00 / 15:00-16:00), supaya bisa dikecualikan saat rekap penilaian.
            $table->boolean('di_luar_jam')->default(false)->after('bukti_path');
        });
    }

    public function down(): void
    {
        Schema::table('absensis', function (Blueprint $table) {
            $table->dropColumn(['sift', 'keterangan', 'bukti_path', 'di_luar_jam']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('notifikasis', function (Blueprint $table) {
            $table->foreignId('pendaftaran_id')->nullable()->after('halaman')
                ->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('notifikasis', function (Blueprint $table) {
            $table->dropForeign(['pendaftaran_id']);
            $table->dropColumn('pendaftaran_id');
        });
    }
};
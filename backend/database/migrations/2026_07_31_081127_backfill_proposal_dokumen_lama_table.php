<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Dokumen "Proposal" baru ditambahkan sebagai syarat wajib setelah
     * beberapa pendaftaran lama sudah ada di database. Pendaftaran yang
     * dibuat SEBELUM perubahan ini tidak otomatis punya baris dokumen
     * "Proposal" (karena PendaftaranController::store() hanya membuatnya
     * untuk pendaftaran baru). Migration ini menambahkan baris "Proposal"
     * (status belum-upload) untuk setiap pendaftaran lama yang belum
     * memilikinya, supaya semua pendaftar — lama maupun baru — sama-sama
     * diminta melengkapi 7 dokumen.
     */
    public function up(): void
    {
        $pendaftaranIds = DB::table('pendaftarans')->pluck('id');

        $sudahPunyaProposal = DB::table('dokumens')
            ->where('jenis', 'Proposal')
            ->pluck('pendaftaran_id')
            ->all();

        $now = now();
        $baris = [];

        foreach ($pendaftaranIds as $id) {
            if (in_array($id, $sudahPunyaProposal, true)) {
                continue;
            }

            $baris[] = [
                'pendaftaran_id' => $id,
                'jenis' => 'Proposal',
                'status' => 'belum-upload',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (!empty($baris)) {
            DB::table('dokumens')->insert($baris);
        }
    }

    public function down(): void
    {
        DB::table('dokumens')->where('jenis', 'Proposal')->delete();
    }
};

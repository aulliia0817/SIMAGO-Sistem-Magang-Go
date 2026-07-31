<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('pendaftarans as p')
            ->whereNull('p.dokumen_dikirim_at')
            ->where(function ($q) {
                $q->whereIn('p.status', ['disetujui', 'ditolak'])
                    ->orWhereNotExists(function ($sub) {
                        $sub->selectRaw(1)
                            ->from('dokumens as d')
                            ->whereColumn('d.pendaftaran_id', 'p.id')
                            ->where('d.status', '!=', 'ditolak')
                            ->whereNull('d.file_path');
                    });
            })
            ->update(['p.dokumen_dikirim_at' => DB::raw('p.created_at')]);
    }

    public function down(): void
    {
    }
};
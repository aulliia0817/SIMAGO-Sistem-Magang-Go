<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rekomendasis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('peserta_magang_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pembimbing_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('kedisiplinan');
            $table->unsignedTinyInteger('teknis');
            $table->unsignedTinyInteger('sikap');
            $table->unsignedTinyInteger('inisiatif');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rekomendasis');
    }
};
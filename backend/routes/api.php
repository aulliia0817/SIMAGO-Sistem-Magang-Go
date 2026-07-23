<?php

use App\Http\Controllers\Api\AbsensiController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DivisiController;
use App\Http\Controllers\Api\DokumenController;
use App\Http\Controllers\Api\LaporanHarianController;
use App\Http\Controllers\Api\PembimbingController;
use App\Http\Controllers\Api\PendaftaranController;
use App\Http\Controllers\Api\PengaturanController;
use App\Http\Controllers\Api\PesertaMagangController;
use App\Http\Controllers\Api\ProfilController;
use App\Http\Controllers\Api\SertifikatController;
use Illuminate\Support\Facades\Route;

// ─── Public ─────────────────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Divisi list is needed on the public registration form (Step 3: pilih divisi)
Route::get('/divisi', [DivisiController::class, 'index']);

// Status buka/tutup periode pendaftaran — dicek form pendaftaran calon sebelum submit
Route::get('/pengaturan/periode', [PengaturanController::class, 'periode']);

// ─── Authenticated (Sanctum token) ─────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::get('/profil', [ProfilController::class, 'show']);
    Route::put('/profil', [ProfilController::class, 'update']);

    // ── Calon Magang ──────────────────────────────────────────────────────
    Route::middleware('role:calon,peserta')->group(function () {
        Route::post('/pendaftaran', [PendaftaranController::class, 'store']);
        Route::get('/pendaftaran/saya', [PendaftaranController::class, 'mine']);
        Route::get('/dokumen/saya', [DokumenController::class, 'mine']);
        Route::post('/dokumen/{dokumen}/upload', [DokumenController::class, 'upload']);
    });

    // ── Peserta Magang ────────────────────────────────────────────────────
    Route::middleware('role:peserta')->group(function () {
        Route::get('/peserta/saya', [PesertaMagangController::class, 'mine']);
        Route::get('/absensi/saya', [AbsensiController::class, 'mine']);
        Route::post('/absensi', [AbsensiController::class, 'store']);
        Route::post('/absensi/checkout', [AbsensiController::class, 'checkout']);
        Route::get('/laporan/saya', [LaporanHarianController::class, 'mine']);
        Route::post('/laporan', [LaporanHarianController::class, 'store']);
        Route::get('/sertifikat/saya', [SertifikatController::class, 'mine']);
    });

    // ── Pembimbing Lapangan ───────────────────────────────────────────────
    Route::middleware('role:pembimbing,admin')->group(function () {
        Route::put('/absensi/{absensi}/verifikasi', [AbsensiController::class, 'verify']);
        Route::put('/laporan/{laporanHarian}/review', [LaporanHarianController::class, 'review']);
    });

    // ── Admin ──────────────────────────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('divisi', DivisiController::class)->except(['index', 'show']);
        Route::apiResource('pembimbing', PembimbingController::class)->except(['show']);

        Route::get('/pendaftar', [PendaftaranController::class, 'index']);
        Route::get('/pendaftar/{pendaftaran}', [PendaftaranController::class, 'show']);
        Route::put('/pendaftar/{pendaftaran}', [PendaftaranController::class, 'updateStatus']);
        Route::delete('/pendaftar/{pendaftaran}', [PendaftaranController::class, 'destroy']);

        Route::post('/sertifikat', [SertifikatController::class, 'store']);
        Route::put('/sertifikat/{sertifikat}', [SertifikatController::class, 'update']);

        Route::put('/pengaturan/periode', [PengaturanController::class, 'updatePeriode']);

        // Penempatan: tempatkan pendaftar yang sudah disetujui ke divisi + pembimbing
        Route::post('/peserta', [PesertaMagangController::class, 'store']);
    });

    // ── Bersama (admin + pembimbing) ──────────────────────────────────────
    Route::middleware('role:admin,pembimbing')->group(function () {
        Route::get('/peserta', [PesertaMagangController::class, 'index']);
        Route::get('/peserta/{pesertaMagang}', [PesertaMagangController::class, 'show']);
        Route::put('/peserta/{pesertaMagang}', [PesertaMagangController::class, 'update']);

        Route::get('/absensi', [AbsensiController::class, 'index']);
        Route::get('/laporan', [LaporanHarianController::class, 'index']);
        Route::get('/sertifikat', [SertifikatController::class, 'index']);

        Route::get('/verifikasi', [DokumenController::class, 'index']);
        Route::put('/verifikasi/{dokumen}', [DokumenController::class, 'review']);
    });
});

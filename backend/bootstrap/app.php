<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // NOTE: kita pakai Sanctum dalam mode token (Bearer), bukan cookie/session,
        // jadi statefulApi() sengaja TIDAK diaktifkan — kalau diaktifkan, request dari
        // origin yang terdaftar di config/sanctum.php akan dipaksa lewat middleware
        // session + CSRF milik web, dan login token akan gagal dengan
        // "CSRF token mismatch" karena axios tidak mengirim cookie/XSRF token.

        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Consistent JSON error responses for the API, matching the
        // Loading / Empty / Not Found / Unauthorized / Forbidden /
        // Validation / Server Error states the frontend expects.
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Data yang dikirim tidak valid.',
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Sesi berakhir atau token tidak valid. Silakan login kembali.',
                ], 401);
            }
        });

        $exceptions->render(function (AuthorizationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Anda tidak memiliki akses untuk melakukan aksi ini.',
                ], 403);
            }
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Data tidak ditemukan.',
                ], 404);
            }
        });

        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*') && ! app()->hasDebugModeEnabled()) {
                return response()->json([
                    'message' => 'Terjadi kesalahan pada server.',
                ], 500);
            }
        });
    })->create();

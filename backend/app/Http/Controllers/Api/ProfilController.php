<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfilController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user()->load('mahasiswa', 'pembimbing.divisi');

        return response()->json([
            'nama' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'mahasiswa' => $user->mahasiswa,
            'pembimbing' => $user->pembimbing,
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'nama' => ['sometimes', 'required', 'string', 'max:150'],
            'no_hp' => ['sometimes', 'nullable', 'string', 'max:20'],
            'password' => ['sometimes', 'nullable', 'string', 'min:6'],
        ]);

        if (isset($data['nama'])) {
            $user->update(['name' => $data['nama']]);
        }

        if (! empty($data['password'])) {
            $user->update(['password' => Hash::make($data['password'])]);
        }

        if (isset($data['no_hp']) && $user->mahasiswa) {
            $user->mahasiswa->update(['no_hp' => $data['no_hp']]);
        }

        return response()->json(['message' => 'Profil berhasil diperbarui.']);
    }
}

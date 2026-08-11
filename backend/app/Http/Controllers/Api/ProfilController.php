<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfilController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user()->load('mahasiswa');

        return response()->json([
            'nama' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'mahasiswa' => $user->mahasiswa,
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'nama' => ['sometimes', 'required', 'string', 'max:150'],
            'no_hp' => ['sometimes', 'nullable', 'string', 'max:20'],
            'institusi' => ['sometimes', 'nullable', 'string', 'max:150'],
            'jurusan' => ['sometimes', 'nullable', 'string', 'max:150'],
            'semester' => ['sometimes', 'nullable', 'string', 'max:10'],
            'password' => ['sometimes', 'nullable', 'string', 'min:6'],
        ]);

        if (isset($data['nama'])) {
            $user->update(['name' => $data['nama']]);
        }

        if (!empty($data['password'])) {
            $user->update(['password' => Hash::make($data['password'])]);
        }

        if ($user->mahasiswa) {
            $mahasiswaData = collect($data)
                ->only(['no_hp', 'institusi', 'jurusan', 'semester'])
                ->toArray();

            if (!empty($mahasiswaData)) {
                $user->mahasiswa->update($mahasiswaData);
            }
        }

        return response()->json(['message' => 'Profil berhasil diperbarui.']);
    }
}
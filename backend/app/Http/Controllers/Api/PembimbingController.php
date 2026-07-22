<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePembimbingRequest;
use App\Http\Requests\UpdatePembimbingRequest;
use App\Http\Resources\PembimbingResource;
use App\Models\Pembimbing;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PembimbingController extends Controller
{
    public function index()
    {
        return PembimbingResource::collection(Pembimbing::with(['user', 'divisi'])->latest()->get());
    }

    public function store(StorePembimbingRequest $request)
    {
        $data = $request->validated();

        $pembimbing = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['nama'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => 'pembimbing',
            ]);

            return Pembimbing::create([
                'user_id' => $user->id,
                'divisi_id' => $data['divisi_id'],
                'nip' => $data['nip'],
                'status' => $data['status'] ?? 'aktif',
            ]);
        });

        return new PembimbingResource($pembimbing->load(['user', 'divisi']));
    }

    public function update(UpdatePembimbingRequest $request, Pembimbing $pembimbing)
    {
        $data = $request->validated();

        if (isset($data['nama']) || isset($data['email'])) {
            $pembimbing->user->update(array_filter([
                'name' => $data['nama'] ?? null,
                'email' => $data['email'] ?? null,
            ]));
        }

        $pembimbing->update(array_filter([
            'nip' => $data['nip'] ?? null,
            'divisi_id' => $data['divisi_id'] ?? null,
            'status' => $data['status'] ?? null,
        ], fn ($v) => $v !== null));

        return new PembimbingResource($pembimbing->load(['user', 'divisi']));
    }

    public function destroy(Pembimbing $pembimbing)
    {
        $pembimbing->user()->delete();
        $pembimbing->delete();

        return response()->json(['message' => 'Pembimbing dihapus.']);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDivisiRequest;
use App\Http\Resources\DivisiResource;
use App\Models\Divisi;

class DivisiController extends Controller
{
    public function index()
    {
        return DivisiResource::collection(Divisi::orderBy('nama')->get());
    }

    public function store(StoreDivisiRequest $request)
    {
        $divisi = Divisi::create($request->validated());

        return new DivisiResource($divisi);
    }

    public function update(StoreDivisiRequest $request, Divisi $divisi)
    {
        $divisi->update($request->validated());

        return new DivisiResource($divisi);
    }

    public function destroy(Divisi $divisi)
    {
        $divisi->delete();

        return response()->json(['message' => 'Divisi dihapus.']);
    }
}

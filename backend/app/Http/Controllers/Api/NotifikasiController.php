<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotifikasiResource;
use App\Models\Notifikasi;
use Illuminate\Http\Request;

class NotifikasiController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->notifikasis()->latest();

        $unreadCount = (clone $query)->where('dibaca', false)->count();
        $items = $query->limit(30)->get();

        return response()->json([
            'data' => NotifikasiResource::collection($items),
            'unread_count' => $unreadCount,
        ]);
    }

    public function markRead(Request $request, Notifikasi $notifikasi)
    {
        abort_unless($notifikasi->user_id === $request->user()->id, 403);

        $notifikasi->update(['dibaca' => true]);

        return new NotifikasiResource($notifikasi);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->notifikasis()->where('dibaca', false)->update(['dibaca' => true]);

        return response()->json(['message' => 'Semua notifikasi ditandai sudah dibaca.']);
    }

    public function destroy(Request $request, Notifikasi $notifikasi)
    {
        abort_unless($notifikasi->user_id === $request->user()->id, 403);

        $notifikasi->delete();

        return response()->json(['message' => 'Notifikasi dihapus.']);
    }
}
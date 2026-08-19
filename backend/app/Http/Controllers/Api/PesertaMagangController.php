<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PesertaMagangResource;
use App\Models\PesertaMagang;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PesertaMagangController extends Controller
{
    /** Admin: semua peserta magang. */
    public function index(Request $request)
    {
        $query = PesertaMagang::with(['mahasiswa.user', 'divisi']);

        if ($divisiId = $request->query('divisi_id')) {
            $query->where('divisi_id', $divisiId);
        }

        if ($status = $request->query('status')) {
            if ($status !== 'semua') {
                $query->where('status', $status);
            }
        }

        return PesertaMagangResource::collection($query->latest()->get());
    }

    public function show(PesertaMagang $pesertaMagang)
    {
        return new PesertaMagangResource($pesertaMagang->load(['mahasiswa.user', 'divisi']));
    }

    /** Admin: ubah divisi/periode/status peserta. */
    public function update(Request $request, PesertaMagang $pesertaMagang)
    {
        $data = $request->validate([
            'divisi_id' => ['sometimes', 'exists:divisis,id'],
            'status' => ['sometimes', 'in:aktif,selesai,diberhentikan'],
        ]);

        $pesertaMagang->update($data);

        return new PesertaMagangResource($pesertaMagang->load(['mahasiswa.user', 'divisi']));
    }

    /** Peserta: data magang milik sendiri. */
    public function mine(Request $request)
    {
        $peserta = $request->user()->mahasiswa?->pesertaMagang;

        abort_unless($peserta, 404, 'Anda belum menjadi peserta magang aktif.');

        return new PesertaMagangResource($peserta->load(['mahasiswa.user', 'divisi']));
    }

    public function rekapAbsensi(PesertaMagang $pesertaMagang)
    {
        $pesertaMagang->load(['mahasiswa.user', 'divisi']);

        $absensiPerTanggal = $pesertaMagang->absensis()
            ->orderBy('tanggal')
            ->get()
            ->keyBy(fn ($a) => $a->tanggal->toDateString());

        $mulai = $pesertaMagang->tanggal_mulai;
        $selesai = $pesertaMagang->tanggal_selesai;
        $batasAkhir = $selesai && $selesai->isBefore(now()) ? $selesai : now();

        $mingguan = [];

        if ($mulai && $mulai->lte($batasAkhir)) {
            $cursor = $mulai->copy();
            $mingguKe = 0;
            $awalMingguSaatIni = null;
            $hariMingguIni = [];

            while ($cursor->lte($batasAkhir)) {
                if ($cursor->isWeekday()) {
                    $awalMinggu = $cursor->copy()->startOfWeek(Carbon::MONDAY);

                    if (! $awalMingguSaatIni || ! $awalMinggu->isSameDay($awalMingguSaatIni)) {
                        if ($awalMingguSaatIni) {
                            $mingguKe++;
                            $mingguan[] = $this->bentukRekapMinggu($mingguKe, $awalMingguSaatIni, $hariMingguIni);
                        }
                        $awalMingguSaatIni = $awalMinggu;
                        $hariMingguIni = [];
                    }

                    $absensi = $absensiPerTanggal->get($cursor->toDateString());

                    $hariMingguIni[] = [
                        'hari' => $cursor->translatedFormat('l'),
                        'tanggal' => $cursor->translatedFormat('d F Y'),
                        'jam_masuk' => $absensi?->status === 'hadir' ? $absensi->jam_masuk : null,
                        'jam_keluar' => $absensi?->status === 'hadir' ? $absensi->jam_keluar : null,
                    ];
                }

                $cursor->addDay();
            }

            if ($awalMingguSaatIni) {
                $mingguKe++;
                $mingguan[] = $this->bentukRekapMinggu($mingguKe, $awalMingguSaatIni, $hariMingguIni);
            }
        }

        $izinSakitTerlambat = $absensiPerTanggal
            ->map(function ($absensi) {
                $status = match (true) {
                    $absensi->status === 'izin' => 'Izin',
                    $absensi->status === 'sakit' => 'Sakit',
                    (bool) $absensi->di_luar_jam => 'Terlambat Absen',
                    default => null,
                };

                if (! $status) {
                    return null;
                }

                return [
                    'tanggal_urut' => $absensi->tanggal->toDateString(),
                    'tanggal' => $absensi->tanggal->translatedFormat('d F Y'),
                    'hari' => $absensi->tanggal->translatedFormat('l'),
                    'status' => $status,
                    'keterangan' => $absensi->keterangan,
                ];
            })
            ->filter()
            ->sortByDesc('tanggal_urut')
            ->values()
            ->map(fn ($row) => collect($row)->except('tanggal_urut')->all());

        return response()->json([
            'data' => [
                'peserta' => [
                    'id' => $pesertaMagang->id,
                    'nama' => $pesertaMagang->mahasiswa->user->name ?? '-',
                    'divisi' => $pesertaMagang->divisi->nama ?? '-',
                    'tanggal_mulai' => optional($mulai)->translatedFormat('d F Y'),
                    'tanggal_selesai' => optional($selesai)->translatedFormat('d F Y'),
                ],
                'mingguan' => $mingguan,
                'izin_sakit_terlambat' => $izinSakitTerlambat,
            ],
        ]);
    }

    private function bentukRekapMinggu(int $nomor, Carbon $awalMinggu, array $hari): array
    {
        $akhirMinggu = $awalMinggu->copy()->addDays(4); // Jumat

        return [
            'minggu' => $nomor,
            'periode' => $awalMinggu->translatedFormat('d F Y').' - '.$akhirMinggu->translatedFormat('d F Y'),
            'hari' => $hari,
        ];
    }
}

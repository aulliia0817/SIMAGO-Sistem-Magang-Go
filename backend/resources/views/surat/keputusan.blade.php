<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Surat {{ $nomorSurat }}</title>
    <style>
        {{-- Template sementara — ganti isi <style> dan markup di bawah kapan saja
             sesuai kop surat/format resmi instansi. Variabel yang tersedia:
             $nomorSurat, $diterima (bool), $tanggal, $nama, $institusi, $jurusan,
             $divisi, $periode, $tanggalMulai, $tanggalSelesai. --}}
        body { font-family: 'Helvetica', sans-serif; font-size: 12px; color: #1a1a1a; }
        .kop { text-align: center; border-bottom: 3px double #1B4332; padding-bottom: 10px; margin-bottom: 20px; }
        .kop h1 { font-size: 15px; margin: 0; color: #1B4332; }
        .kop p { margin: 2px 0; font-size: 11px; }
        .meta { width: 100%; margin-bottom: 16px; }
        .meta td { vertical-align: top; padding: 1px 0; }
        .judul { text-align: center; text-decoration: underline; font-weight: bold; margin: 18px 0; }
        .isi { text-align: justify; line-height: 1.6; }
        table.data { margin: 12px auto; border-collapse: collapse; }
        table.data td { padding: 2px 8px; }
        .ttd { margin-top: 50px; width: 100%; }
        .ttd td { width: 50%; text-align: center; vertical-align: top; }
        .ttd .nama-ttd { margin-top: 60px; font-weight: bold; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="kop">
        <h1>PEMERINTAH KABUPATEN MADIUN</h1>
        <h1>DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL</h1>
        <p>Jl. Contoh Alamat No. 1, Madiun — Telp. (0351) 000000</p>
    </div>

    <table class="meta">
        <tr>
            <td width="70">Nomor</td><td width="10">:</td><td>{{ $nomorSurat }}</td>
        </tr>
        <tr>
            <td>Perihal</td><td>:</td><td>Pemberitahuan Hasil Seleksi Magang</td>
        </tr>
    </table>

    <p>Kepada Yth.<br>
    Sdr/i {{ $nama }}<br>
    di Tempat</p>

    <div class="judul">
        {{ $diterima ? 'SURAT PENERIMAAN MAGANG' : 'SURAT PEMBERITAHUAN HASIL SELEKSI MAGANG' }}
    </div>

    <div class="isi">
        <p>Dengan hormat,</p>

        @if ($diterima)
            <p>
                Sehubungan dengan permohonan magang yang telah Saudara/i ajukan, dengan ini kami
                sampaikan bahwa Saudara/i <strong>{{ $nama }}</strong> ({{ $institusi }} — {{ $jurusan }})
                dinyatakan <strong>DITERIMA</strong> untuk melaksanakan kegiatan magang dengan
                ketentuan sebagai berikut:
            </p>
            <table class="data">
                <tr><td>Divisi Penempatan</td><td>:</td><td>{{ $divisi }}</td></tr>
                <tr><td>Periode Magang</td><td>:</td><td>{{ $tanggalMulai }} s.d. {{ $tanggalSelesai }}</td></tr>
            </table>
            <p>
                Selanjutnya Saudara/i diharapkan hadir sesuai jadwal di atas dengan membawa surat
                ini sebagai bukti penerimaan.
            </p>
        @else
            <p>
                Sehubungan dengan permohonan magang yang telah Saudara/i ajukan pada divisi
                <strong>{{ $divisi }}</strong>, dengan ini kami sampaikan bahwa untuk periode ini
                Saudara/i <strong>{{ $nama }}</strong> ({{ $institusi }} — {{ $jurusan }}) belum dapat
                kami terima untuk melaksanakan kegiatan magang.
            </p>
            <p>
                Keputusan ini tidak mengurangi kesempatan Saudara/i untuk mengajukan permohonan
                kembali pada periode berikutnya.
            </p>
        @endif

        <p>Demikian surat ini kami sampaikan, atas perhatiannya kami ucapkan terima kasih.</p>
    </div>

    <table class="ttd">
        <tr>
            <td></td>
            <td>
                Madiun, {{ $tanggal }}<br>
                Admin SIMAGO
                <div class="nama-ttd">&nbsp;</div>
            </td>
        </tr>
    </table>
</body>
</html>

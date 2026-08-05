<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="utf-8">
    <title>Sertifikat {{ $nomor }}</title>
    <style>
        {
                {
                -- Template UJI COBA — ganti isi <style>dan markup di bawah kapan saja sesuai desain sertifikat resmi instansi (misalnya tambah logo,
                    ornamen, watermark). Variabel yang tersedia: $nomor, $nama,
                    $institusi, $jurusan, $divisi, $tanggalMulai, $tanggalSelesai,
                    $tanggalTerbit. --
            }
        }

        @page {
            margin: 0;
        }

        body {
            font-family: 'Helvetica', sans-serif;
            color: #1a1a1a;
            margin: 0;
        }

        .bingkai {
            border: 10px solid #1B4332;
            padding: 6px;
            margin: 18px;
        }

        .bingkai-dalam {
            border: 2px solid #C9A227;
            padding: 40px 56px;
            text-align: center;
            min-height: 480px;
        }

        .catatan-uji-coba {
            text-align: center;
            font-family: Arial, sans-serif;
            font-size: 10px;
            color: #7a5c00;
            background: #fff8e1;
            border: 1px dashed #c9a227;
            padding: 4px 8px;
            margin: 4px 24px 0;
        }

        .instansi {
            font-size: 13px;
            letter-spacing: 1px;
            color: #1B4332;
            margin: 0;
        }

        .instansi-sub {
            font-size: 11px;
            color: #555;
            margin: 2px 0 0;
        }

        .judul {
            font-size: 34px;
            font-weight: bold;
            color: #1B4332;
            letter-spacing: 4px;
            margin: 28px 0 4px;
        }

        .nomor {
            font-size: 11px;
            color: #6B7770;
            margin-bottom: 24px;
        }

        .diberikan {
            font-size: 12px;
            color: #444;
            margin-bottom: 4px;
        }

        .nama {
            font-size: 28px;
            font-weight: bold;
            color: #1B4332;
            border-bottom: 1px solid #C9A227;
            display: inline-block;
            padding: 0 24px 6px;
            margin-bottom: 18px;
        }

        .deskripsi {
            font-size: 12.5px;
            line-height: 1.8;
            color: #333;
            max-width: 560px;
            margin: 0 auto;
        }

        .deskripsi strong {
            color: #1B4332;
        }

        .ttd-wrap {
            margin-top: 56px;
            width: 100%;
        }

        .ttd-wrap td {
            width: 50%;
            text-align: center;
            font-size: 11px;
            color: #444;
        }

        .ttd-wrap .nama-ttd {
            margin-top: 56px;
            font-weight: bold;
            text-decoration: underline;
            color: #1B4332;
        }
    </style>
</head>

<body>
    <div class="catatan-uji-coba">
        Catatan: ini template sertifikat UJI COBA/sementara. Desain (logo, ornamen, tata letak) bisa diganti kapan saja
        tanpa mengubah data.
    </div>
    <div class="bingkai">
        <div class="bingkai-dalam">
            <p class="instansi">PEMERINTAH KABUPATEN MADIUN</p>
            <p class="instansi-sub">Dinas Kependudukan dan Pencatatan Sipil</p>

            <div class="judul">SERTIFIKAT</div>
            <div class="nomor">Nomor: {{ $nomor }}</div>

            <p class="diberikan">Diberikan kepada:</p>
            <div class="nama">{{ $nama }}</div>

            <p class="deskripsi">
                Atas partisipasi dan kinerjanya selama mengikuti program magang
                di <strong>Dinas Kependudukan dan Pencatatan Sipil Kabupaten Madiun</strong>
                pada Divisi <strong>{{ $divisi }}</strong>, yang diselenggarakan
                dari tanggal <strong>{{ $tanggalMulai }}</strong> sampai dengan
                <strong>{{ $tanggalSelesai }}</strong>, sebagai mahasiswa dari
                <strong>{{ $institusi }}</strong>, Program Studi {{ $jurusan }}.
            </p>

            <table class="ttd-wrap">
                <tr>
                    <td></td>
                    <td>
                        Madiun, {{ $tanggalTerbit }}<br>
                        Kepala Dinas Kependudukan dan Pencatatan Sipil<br>
                        Kabupaten Madiun
                        <div class="nama-ttd">&nbsp;</div>
                        NIP. .........................................
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>

</html>
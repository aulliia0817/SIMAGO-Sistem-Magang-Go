import axios from "axios";

/**
 * Axios instance terpusat untuk seluruh panggilan ke backend Laravel.
 * Base URL diambil dari environment variable, TIDAK di-hardcode
 * (lihat .env.example -> VITE_API_URL).
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api",
  headers: { Accept: "application/json" },
});

// Sisipkan token Bearer (disimpan di localStorage setelah login) ke setiap request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("simago_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Kalau token sudah tidak valid (401), paksa logout supaya user diarahkan ke login lagi.
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("simago_token");
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Ambil pesan error yang konsisten dari response Laravel (validation / message biasa). */
export function apiErrorMessage(
  error: unknown,
  fallback = "Terjadi kesalahan. Silakan coba lagi.",
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    if (data?.errors) {
      const first = Object.values(data.errors)[0]?.[0];
      if (first) return first;
    }
    if (data?.message) return data.message;
  }
  return fallback;
}

/**
 * Buka file (dokumen/sertifikat) di tab baru lewat request terautentikasi.
 * Dipakai untuk endpoint seperti /dokumen/{id}/file — tidak bisa dibuka lewat
 * <a href> biasa karena butuh header Authorization (Bearer token).
 */
export async function openAuthenticatedFile(path: string): Promise<void> {
  const res = await api.get(path, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(res.data as Blob);
  window.open(blobUrl, "_blank");
  // Beri waktu tab baru memuat sebelum URL objek dilepas dari memori.
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

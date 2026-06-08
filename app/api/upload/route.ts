// src/app/api/upload/route.ts
//
// Upload gambar ke Cloudinary menggunakan UNSIGNED upload preset.
// Cara ini jauh lebih simpel — tidak perlu signature manual.
//
// ── Setup di Cloudinary Dashboard ────────────────────────────────────────────
// 1. Login ke cloudinary.com → Settings → Upload
// 2. Scroll ke "Upload presets" → klik "Add upload preset"
// 3. Signing mode: UNSIGNED
// 4. Folder: eventara  (opsional, untuk organisasi)
// 5. Salin nama preset (misal: "eventara_unsigned")
// 6. Tambahkan ke .env.local:
//      CLOUDINARY_CLOUD_NAME=your_cloud_name
//      CLOUDINARY_UPLOAD_PRESET=eventara_unsigned
//
// Tidak perlu API_KEY dan API_SECRET untuk unsigned upload.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const CLOUD_NAME    = process.env.CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET!;

const FOLDER_MAP: Record<string, string> = {
  cover:   "eventara/covers",
  gallery: "eventara/gallery",
  logo:    "eventara/logos",
};

const MAX_SIZE: Record<string, number> = {
  cover:   5 * 1024 * 1024,
  gallery: 5 * 1024 * 1024,
  logo:    2 * 1024 * 1024,
};

export async function POST(request: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Cek env vars ────────────────────────────────────────────────────────────
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    console.error("[Upload] Missing env vars: CLOUDINARY_CLOUD_NAME or CLOUDINARY_UPLOAD_PRESET");
    return NextResponse.json(
      { error: "Konfigurasi upload belum lengkap. Hubungi administrator." },
      { status: 500 }
    );
  }

  // ── Parse request ───────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Request tidak valid" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const type = (formData.get("type") as string | null) ?? "cover";

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }

  // ── Validasi ────────────────────────────────────────────────────────────────
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Format tidak didukung. Gunakan JPG, PNG, atau WebP." },
      { status: 400 }
    );
  }

  const maxSize = MAX_SIZE[type] ?? 5 * 1024 * 1024;
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024);
    return NextResponse.json(
      { error: `Ukuran file maksimal ${maxMB} MB` },
      { status: 400 }
    );
  }

  // ── Upload ke Cloudinary (unsigned) ─────────────────────────────────────────
  const folder   = FOLDER_MAP[type] ?? "eventara/misc";
  const publicId = `${session.user.id}_${Date.now()}`;

  const upload = new FormData();
  upload.append("file",          file);
  upload.append("upload_preset", UPLOAD_PRESET);
  upload.append("folder",        folder);
  upload.append("public_id",     publicId);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: upload }
    );

    const data = await res.json();

    if (!res.ok) {
      // Cloudinary mengembalikan pesan error yang detail
      const msg = data?.error?.message ?? "Upload ke Cloudinary gagal";
      console.error("[Cloudinary error]", msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({
      url:      data.secure_url,
      publicId: data.public_id,
      width:    data.width,
      height:   data.height,
    });

  } catch (err) {
    console.error("[Upload fetch error]", err);
    return NextResponse.json(
      { error: "Gagal terhubung ke server upload. Coba lagi." },
      { status: 500 }
    );
  }
}
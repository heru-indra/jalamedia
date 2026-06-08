// src/app/api/categories/route.ts
// GET /api/categories — kembalikan semua kategori sebagai JSON

import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(categories)
      .orderBy(categories.name);

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/categories]", err);
    return NextResponse.json(
      { error: "Gagal mengambil kategori" },
      { status: 500 }
    );
  }
}
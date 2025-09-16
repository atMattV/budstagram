import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const caption = formData.get("caption") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Upload file to Vercel Blob
    const blob = await put(file.name, file, { access: "public" });

    // Save post info in DB
    const post = await prisma.post.create({
      data: {
        caption: caption || "",
        imageUrl: blob.url,
        published: true,
        slug: blob.url.split("/").pop() || crypto.randomUUID(),
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

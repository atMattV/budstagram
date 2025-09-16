import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  const form = await req.formData();
  const caption = form.get("caption") as string;
  const file = form.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // upload to vercel blob
  const blob = await put(file.name, file, { access: "public" });

  const post = await prisma.post.create({
    data: {
      caption,
      imageUrl: blob.url,
      published: true,
    },
  });

  revalidatePath("/");

  return NextResponse.json({ success: true, post });
}

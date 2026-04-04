import { NextResponse } from "next/server";
import { generatePresignedUrl } from "@/lib/s3";

export async function POST(req) {
  try {
    const body = await req.json();
    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "Missing fileName or fileType" }, 
        { status: 400 }
      );
    }

    // Get the temporary upload URL and the permanent file URL
    const { signedUrl, fileUrl } = await generatePresignedUrl(fileName, fileType);

    return NextResponse.json({ signedUrl, fileUrl });
    
  } catch (error) {
    console.error("S3 Presigned URL Error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" }, 
      { status: 500 }
    );
  }
}
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response("Missing url", { status: 400 });
  }

  // Only allow our own S3 bucket
  if (!url.includes("creatormonk-assets-prod.s3")) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch");

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const fileName = decodeURIComponent(url.split("/").pop().split("?")[0]) || "download";

    return new Response(res.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Failed to fetch file", { status: 500 });
  }
}
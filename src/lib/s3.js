import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 1. Initialize the S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function generatePresignedUrl(fileName, fileType,clientId) {
  // 2. Clean the file name and make it unique so we don't overwrite existing files
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  // const uniqueFileName = `${Date.now()}-${cleanFileName}`;
const uniqueFileName = `clients/${clientId}/posts/${Date.now()}-${cleanFileName}`;
  // 3. Create the command telling AWS we want to put an object in the bucket
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: uniqueFileName,
    ContentType: fileType,
  });

  // 4. Generate the secure URL (expires in 60 seconds)
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
  
  // 5. This is the permanent public URL where the file will live after upload
  const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;

  return { signedUrl, fileUrl };
}
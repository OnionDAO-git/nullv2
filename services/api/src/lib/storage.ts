import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AvatarContentType = (typeof ALLOWED_AVATAR_TYPES)[number];
export const MAX_AVATAR_SIZE = 10 * 1024 * 1024;
const PRESIGN_TTL_SECONDS = 300;

export function isAllowedAvatarType(value: string): value is AvatarContentType {
  return (ALLOWED_AVATAR_TYPES as readonly string[]).includes(value);
}

export interface S3Config {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

function readConfig(): S3Config | null {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;
  return { endpoint, bucket, accessKeyId, secretAccessKey };
}

let _client: S3Client | null = null;
let _config: S3Config | null = null;

function getClient(): { client: S3Client; config: S3Config } {
  if (_client && _config) return { client: _client, config: _config };
  const cfg = readConfig();
  if (!cfg) {
    throw new Error(
      'S3 not configured — set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY',
    );
  }
  _config = cfg;
  _client = new S3Client({
    endpoint: cfg.endpoint,
    region: 'auto',
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    forcePathStyle: true,
  });
  return { client: _client, config: _config };
}

function extFor(contentType: AvatarContentType): string {
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'image/png') return 'png';
  return 'webp';
}

function randomToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

export interface PresignedAvatarUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresInSeconds: number;
}

export async function presignAvatarUpload(
  ownerId: string,
  contentType: AvatarContentType,
): Promise<PresignedAvatarUpload> {
  const { client, config } = getClient();
  const key = `residents/${ownerId}/${randomToken()}-${Date.now()}.${extFor(contentType)}`;
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
    { expiresIn: PRESIGN_TTL_SECONDS },
  );
  const publicUrl = `${config.endpoint.replace(/\/$/, '')}/${config.bucket}/${key}`;
  return { uploadUrl, publicUrl, key, expiresInSeconds: PRESIGN_TTL_SECONDS };
}

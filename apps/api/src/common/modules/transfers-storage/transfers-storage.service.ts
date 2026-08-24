import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { EnvService, ENV_SERVICE } from '@libs/env';
import { MultipartFile } from '@fastify/multipart';

const ALLOWED_MIME_TYPES = ['application/zip', 'application/x-zip-compressed'];

// Bucket is private (no `mc anonymous set download` applied — see infra/apps/services/backend/minio/setup-job.yaml).
// Unlike StorageService's public medias bucket, files here are only ever read by this API
// (never a direct client -> S3 URL), so there is no getFileUrl()/public endpoint concept.
@Injectable()
export class TransfersStorageService {
  private readonly logger = new Logger(TransfersStorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(@Inject(ENV_SERVICE) private readonly env: EnvService) {
    this.bucketName = this.env.S3_IMPORTS_BUCKET;

    this.s3Client = new S3Client({
      region: this.env.S3_REGION,
      endpoint: this.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: this.env.S3_ACCESS_KEY_ID,
        secretAccessKey: this.env.S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });
  }

  async uploadImportFile(
    userId: string,
    importJobId: number,
    file: MultipartFile,
  ): Promise<{ key: string }> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    const key = `${userId}/${importJobId}.zip`;
    const buffer = await file.toBuffer();

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);
      return { key };
    } catch (error) {
      this.logger.error(`Failed to upload import file to ${key}:`, error);
      throw new InternalServerErrorException('Could not upload file');
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (!key) return;

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}:`, error);
    }
  }
}

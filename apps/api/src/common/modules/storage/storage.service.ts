import { Injectable, Logger, InternalServerErrorException, BadRequestException, Inject } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { EnvService, ENV_SERVICE } from '@libs/env';
import { AllowedMimeTypes, StorageFolder } from './storage.constants';
import { MultipartFile } from '@fastify/multipart';
import { z } from 'zod'; // <-- Import de Zod

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicEndpoint: string;

  private readonly urlSchema = z.url();

  constructor(
    @Inject(ENV_SERVICE) private readonly env: EnvService
  ) {
    this.bucketName = this.env.S3_BUCKET;
    this.publicEndpoint = this.env.S3_PUBLIC_ENDPOINT || this.env.S3_ENDPOINT;

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

  private generateFilename(originalFilename: string): string {
    const extension = extname(originalFilename).toLowerCase();
    const uniqueName = randomUUID();
    return `${uniqueName}${extension}`;
  }

  private isAbsoluteUrl(value: string): boolean {
    return this.urlSchema.safeParse(value).success;
  }

  getFileUrl(filenameOrUrl: string | null, folder: StorageFolder): string | null {
    if (!filenameOrUrl) return null;
    
    if (this.isAbsoluteUrl(filenameOrUrl)) {
      return filenameOrUrl;
    }

    return `${this.publicEndpoint}/${this.bucketName}/${folder}/${filenameOrUrl}`;
  }

  async uploadFile(
    file: MultipartFile, 
    folder: StorageFolder
  ): Promise<{ filename: string; url: string }> {
    
    const allowedTypes = AllowedMimeTypes[folder];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type for ${folder}. Allowed: ${allowedTypes.join(', ')}`);
    }

    const filename = this.generateFilename(file.filename);
    const fullKey = `${folder}/${filename}`;

    const buffer = await file.toBuffer();

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fullKey,
      Body: buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);
      
      return {
        filename,
        url: this.getFileUrl(filename, folder) as string, 
      };
    } catch (error) {
      this.logger.error(`Failed to upload file to ${folder}:`, error);
      throw new InternalServerErrorException('Could not upload file');
    }
  }

  async deleteFile(filename: string, folder: StorageFolder): Promise<void> {
    if (!filename) return;

    if (this.isAbsoluteUrl(filename)) {
      this.logger.log(`Skipping deletion for external URL: ${filename}`);
      return;
    }

    const fullKey = `${folder}/${filename}`;

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fullKey,
    });

    try {
      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${fullKey}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${fullKey}:`, error);
    }
  }
}
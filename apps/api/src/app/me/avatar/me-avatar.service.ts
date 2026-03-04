import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { StorageService } from '../../../common/modules/storage/storage.service';
import { StorageFolders } from '../../../common/modules/storage/storage.constants';
import { MultipartFile } from '@fastify/multipart';
import { eq } from 'drizzle-orm';
import { user } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { MeService } from '../me.service';
import { UserDto } from '../../users/dto/users.dto';

@Injectable()
export class MeAvatarService {
  private readonly logger = new Logger(MeAvatarService.name);

  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly storageService: StorageService,
    private readonly meService: MeService,
  ) {}

  async set(loggedUser: User, file: MultipartFile): Promise<UserDto> {
    const { filename: newAvatarFilename } = await this.storageService.uploadFile(
      file, 
      StorageFolders.AVATARS
    );

    await this.db.update(user)
      .set({ image: newAvatarFilename })
      .where(eq(user.id, loggedUser.id));

    if (loggedUser?.image) {
      this.storageService.deleteFile(loggedUser.image, StorageFolders.AVATARS).catch(err => 
        this.logger.error(`Failed to delete old avatar: ${loggedUser.image}`, err)
      );
    }

    return this.meService.get(loggedUser);
  }

  async delete(loggedUser: User): Promise<UserDto> {
    if (!loggedUser?.image) {
      throw new BadRequestException('No avatar to delete');
    }

    await this.db.update(user)
      .set({ image: null })
      .where(eq(user.id, loggedUser.id));

    await this.storageService.deleteFile(loggedUser.image, StorageFolders.AVATARS);
    
    return this.meService.get(loggedUser);
  }
}
// import { Inject, Injectable } from '@nestjs/common';
// import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
// import { eq, and } from 'drizzle-orm';

// @Injectable()
// export class UserVisibilityService {
//   constructor(@Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService) {}
//   async canViewContent(viewerId: string, targetUserId: string): Promise<boolean> {
//     if (viewerId === targetUserId) return true;
//     const result = await this.db
//       .select({
//         isPrivate: users.isPrivate,
//         amIFollowing: follows.followerId,
//       })
//       .from(users)
//       .leftJoin(
//         follows,
//         and(
//           eq(follows.followingId, users.id),
//           eq(follows.followerId, viewerId)
//         )
//       )
//       .where(eq(users.id, targetUserId))
//       .limit(1);

//     const target = result[0];
//     if (!target) return false;
//     if (!target.isPrivate) return true;
//     if (target.amIFollowing) return true;

//     return false;
//   }
// }
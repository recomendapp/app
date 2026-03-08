import { ApiProperty, ApiPropertyOptional, ApiSchema, IntersectionType, PickType } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsArray, IsDateString, IsEnum, IsIn, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { playlistMemberRoleEnum } from "@libs/db/schemas";
import { UserSummaryDto } from "../../users/dto/users.dto";
import { SortOrder } from "../../../common/dto/sort.dto";
import { PaginatedResponseDto, PaginationQueryDto } from "../../../common/dto/pagination.dto";
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from "../../../common/dto/cursor-pagination.dto";

export enum PlaylistMemberSortBy {
  CREATED_AT = 'created_at',
}

@ApiSchema({ name: 'PlaylistMember' })
export class PlaylistMemberDto {
    @ApiProperty({ example: 123456, description: 'The unique ID of the member' })
    @Expose()
    id: number;

    @ApiProperty({ example: 52, description: 'The ID of the playlist' })
    @Expose()
    playlistId: number;
    
    @ApiProperty({ example: "user-uuid-123", description: 'The ID of the member' })
    @Expose()
    userId: string;

    @ApiProperty({
        description: 'The role of the member in the playlist',
        enum: playlistMemberRoleEnum.enumValues, 
        example: playlistMemberRoleEnum.enumValues[0],
    })
    @Expose()
    @IsString()
    @IsIn(playlistMemberRoleEnum.enumValues, {
        message: `Role must be one of: ${playlistMemberRoleEnum.enumValues.join(', ')}`
    })
    role: typeof playlistMemberRoleEnum.enumValues[number];

    @ApiProperty()
    @Expose()
    @IsDateString()
    createdAt: string;
}

@ApiSchema({ name: 'PlaylistMemberWithUser' })
export class PlaylistMemberWithUserDto extends PlaylistMemberDto {
    @ApiProperty({ type: () => UserSummaryDto, description: 'The user object' })
    @Expose()
    @ValidateNested()
    @Type(() => UserSummaryDto)
    user: UserSummaryDto;
}

@ApiSchema({ name: 'PlaylistMemberAdd' })
export class PlaylistMemberAddDto {
    @ApiProperty({
        description: 'The list of user IDs to add as members to the playlist. They will be added as "viewer" by default.',
        type: [String],
        example: ['user-uuid-123', 'user-uuid-456']
    })
    @IsArray()
    @IsUUID('all', { each: true })
    userIds: string[];
}

@ApiSchema({ name: 'PlaylistMemberUpdate' })
export class PlaylistMemberUpdateDto extends PickType(PlaylistMemberDto, ['role'] as const) {}

@ApiSchema({ name: 'PlaylistMemberDelete' })
export class PlaylistMemberDeleteDto {
    @ApiProperty({
        description: 'The list of user IDs to remove from the playlist.',
        type: [String],
        example: ['user-uuid-123', 'user-uuid-456']
    })
    @IsArray()
    @IsUUID('all', { each: true })
    userIds: string[];
}

export class BaseListPlaylistMembersQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort members by',
    default: PlaylistMemberSortBy.CREATED_AT,
    enum: PlaylistMemberSortBy,
  })
  @IsOptional()
  @IsEnum(PlaylistMemberSortBy)
  sort_by: PlaylistMemberSortBy = PlaylistMemberSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    default: SortOrder.DESC,
    enum: SortOrder,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sort_order: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ description: 'Search members by username' })
  @IsOptional()
  @IsString()
  search?: string;
}

@ApiSchema({ name: 'ListAllPlaylistMembersQuery' })
export class ListAllPlaylistMembersQueryDto extends BaseListPlaylistMembersQueryDto {}

@ApiSchema({ name: 'ListPaginatedPlaylistMembersQuery' })
export class ListPaginatedPlaylistMembersQueryDto extends IntersectionType(
  BaseListPlaylistMembersQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfinitePlaylistMembersQuery' })
export class ListInfinitePlaylistMembersQueryDto extends IntersectionType(
  BaseListPlaylistMembersQueryDto,
  CursorPaginationQueryDto
) {}

@ApiSchema({ name: 'ListPaginatedPlaylistMembers' })
export class ListPaginatedPlaylistMembersDto extends PaginatedResponseDto<PlaylistMemberWithUserDto> {
  @ApiProperty({ type: () => [PlaylistMemberWithUserDto] })
  @Type(() => PlaylistMemberWithUserDto)
  data: PlaylistMemberWithUserDto[];

  constructor(partial: Partial<ListPaginatedPlaylistMembersDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfinitePlaylistMembers' })
export class ListInfinitePlaylistMembersDto extends CursorPaginatedResponseDto<PlaylistMemberWithUserDto> {
  @ApiProperty({ type: () => [PlaylistMemberWithUserDto] })
  @Type(() => PlaylistMemberWithUserDto)
  data: PlaylistMemberWithUserDto[];

  constructor(partial: Partial<ListInfinitePlaylistMembersDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
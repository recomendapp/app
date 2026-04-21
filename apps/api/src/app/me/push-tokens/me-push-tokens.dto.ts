import { pushProviderEnum, deviceTypeEnum } from '@libs/db/schemas';
import { ApiProperty, ApiSchema, PickType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDateString, IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator';

@ApiSchema({ name: 'PushToken' })
export class PushTokenDto {
	@ApiProperty({ example: 'token-abc123' })
	@Expose()
	@IsUUID()
	id!: string;

	@ApiProperty({ example: 'user-uuid-123' })
	@Expose()
	@IsUUID()
	userId!: string;

	@ApiProperty({ example: 'session-uuid-456' })
	@Expose()
	@IsString()
	sessionId!: string;

	@ApiProperty({
		enum: pushProviderEnum.enumValues,
		description: "The push notification provider (e.g., 'apns', 'fcm', etc.)",
	})
	@Expose()
	@IsString()
	@IsIn(pushProviderEnum.enumValues, {
		message: `Provider must be one of: ${pushProviderEnum.enumValues.join(', ')}`
	})
	provider!: typeof pushProviderEnum.enumValues[number];

	@ApiProperty({ description: "The push token string provided by the client" })
	@Expose()
	@IsString()
	@IsNotEmpty()
	token!: string;

	@ApiProperty({
		enum: deviceTypeEnum.enumValues,
		description: "The device type (e.g., 'web', 'ios', 'android')",
	})
	@Expose()
	@IsString()
	@IsIn(deviceTypeEnum.enumValues, {
		message: `Device type must be one of: ${deviceTypeEnum.enumValues.join(', ')}`
	})
	deviceType!: typeof deviceTypeEnum.enumValues[number];

	@ApiProperty()
	@Expose()
	@IsDateString()
	createdAt!: string;

	@ApiProperty()
	@Expose()
	@IsDateString()
	updatedAt!: string;
}

@ApiSchema({ name: 'PushTokenSet' })
export class PushTokenSetDto extends PickType(PushTokenDto, ['provider', 'token', 'deviceType'] as const) {}
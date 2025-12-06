import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'The title of the review',
    example: 'An amazing cinematic experience',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  title?: string | null;

  @ApiProperty({
    description: 'The body of the review, in HTML format',
    example: '<html><p>This movie was absolutely fantastic!</p></html>',
  })
  @IsString()
  @MinLength(1)
  body: string;
}

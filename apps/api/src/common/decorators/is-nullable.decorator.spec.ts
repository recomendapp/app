import 'reflect-metadata';
import { validate } from 'class-validator';
import { IsString, Length } from 'class-validator';
import { IsNullable } from './is-nullable.decorator';

class SampleDto {
  @IsString()
  @IsNullable()
  @Length(3, 10)
  bio!: string | null;
}

function build(bio: unknown): SampleDto {
  const dto = new SampleDto();
  dto.bio = bio as string | null;
  return dto;
}

describe('IsNullable', () => {
  it('skips the wrapped validators entirely when the value is null', async () => {
    const errors = await validate(build(null));

    expect(errors).toEqual([]);
  });

  it('still runs the wrapped validators when the value is a valid string', async () => {
    const errors = await validate(build('hello'));

    expect(errors).toEqual([]);
  });

  it('still fails the wrapped validators when the value is an invalid (too short) string', async () => {
    const errors = await validate(build('ab'));

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('bio');
  });

  it('still fails when the value is undefined (unlike null, which is explicitly allowed)', async () => {
    const errors = await validate(build(undefined));

    expect(errors.length).toBeGreaterThan(0);
  });

  it('still fails when the value is the wrong type entirely', async () => {
    const errors = await validate(build(42));

    expect(errors.length).toBeGreaterThan(0);
  });
});

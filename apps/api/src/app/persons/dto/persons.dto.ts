import { ApiProperty, ApiSchema, PickType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsString, IsUrl, IsNumber } from 'class-validator';

@ApiSchema({ name: 'Person' })
export class PersonDto {
  @ApiProperty({
	description: "The person's unique identifier",
	example: 525,
	type: Number,
	nullable: false,
  })
  @Expose()
  @IsInt()
  id: number;

  @ApiProperty({
	description: "The person's name",
	example: 'Christopher Nolan',
	type: String,
	nullable: true,
  })
  @Expose()
  @IsString()
  name: string | null;

  @ApiProperty({
	description: "The person's profile image path",
	example: '/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg',
	type: String,
	nullable: true,
  })
  @Expose()
  @IsString()
  profile_path: string | null;

  @ApiProperty({
	description: "The person's birthday",
	example: '1970-07-30',
	type: String,
	nullable: true,
  })
  @Expose()
  @IsString()
  birthday: string | null;

  @ApiProperty({
	description: "The person's deathday",
	example: null,
	type: String,
	nullable: true,
  })
  @Expose()
  @IsString()
  deathday: string | null;

  @ApiProperty({
	description: "The person's homepage URL",
	example: 'http://www.christophernolan.net',
	type: String,
	nullable: true,
  })
  @Expose()
  @IsUrl()
  homepage: string | null;

  @ApiProperty({
	description: "The person's imdb identifier",
	example: 'nm0634240',
	type: String,
	nullable: true,
  })
  @Expose()
  @IsString()
  imdb_id: string | null;

  @ApiProperty({
	description: "The person's kown for department",
	example: 'Directing',
	type: String,
	nullable: true,
  })
  @Expose()
  @IsString()
  known_for_department: string | null;

  @ApiProperty({
	description: "The person's place of birth",
	example: 'Westminster, London, England, UK',
	type: String,
	nullable: true,
  })
  @Expose()
  @IsString()
  place_of_birth: string | null;

  @ApiProperty({
	description:
	  "The person's gender: 0 = Not specified, 1 = Female, 2 = Male, 3 = Non-binary",
	default: 0,
	example: 2,
	type: Number,
	nullable: true,
  })
  @Expose()
  @IsNumber()
  gender: number | null;

  @ApiProperty({
	description: "The person's biography",
	example:
	  'Christopher Nolan (born 30 July 1970) is a British-American filmmaker whose concept-driven epics have reshaped the modern studio blockbuster. Renowned for structurally intricate storytelling, large-format cinematography, and practical effects, he is widely regarded as a defining director of the 21st century. His films have grossed over $6.6 billion worldwide and earned him two Academy Awards, two BAFTAs, and a Golden Globe. He was appointed CBE in 2019 and knighted in 2024 for services to film.\n\nRaised between London and Evanston, Illinois, Nolan began making Super 8 shorts as a child, later studying English literature at University College London, where he ran the Film Society and met his producer and future wife, Emma Thomas; together they founded Syncopy Inc. After shorts like Doodlebug, he self-financed his micro-budget debut Following (1998), then broke through with the reverse-told amnesia noir Memento (2000). Studio work followed with Insomnia (2002) and then Batman Begins (2005), which launched a grounded superhero trilogy completed by The Dark Knight (2008) and The Dark Knight Rises (2012). Between and after those, he mounted original tentpoles—The Prestige (2006), Inception (2010), Interstellar (2014), and the triptych survival drama Dunkirk (2017), which earned his first Best Director nomination.\n\nNolan’s films interrogate time, memory, identity, ethics, and knowledge—sneaking metaphysics into genre frames (noir, heist, war, biopic). Hallmarks include nonlinear or braided timelines, precision cross-cutting, mathematically inflected imagery, practical/in-camera spectacle augmented by visual effects, experimental soundscapes, and a steadfast preference for celluloid (65mm/IMAX) and theatrical exhibition. A frequent collaborator with Jonathan Nolan (co-writer), Emma Thomas (producer), and craftspeople such as Wally Pfister, Hoyte van Hoytema, Lee Smith, and Hans Zimmer, he also advocates globally for film preservation and exhibition, curating restorations and convening archivists to champion photochemical cinema.\n\nAfter the time-bending espionage of Tenet (2020), Nolan departed Warner Bros. and partnered with Universal on Oppenheimer (2023), a morally dense biopic that won him the Academy Awards for Best Director and Best Picture. He is re-teaming with Universal on The Odyssey (scheduled for 2026), an IMAX-shot adaptation of Homer’s epic. In 2025 he was elected President of the Directors Guild of America. Nolan lives in Los Angeles with Thomas and their four children, continuing to pair popular spectacle with intellectual ambition while championing the artistry—and communal ritual—of seeing movies on film, in cinemas.',
	type: String,
	nullable: true,
  })
  @Expose()
  @IsString()
  biography: string | null;

  @ApiProperty({
	description: "The person's popularity score",
	example: 7.3643,
	type: Number,
	nullable: true,
  })
  @Expose()
  @IsNumber()
  popularity: number | null;

  @ApiProperty({
	description: "The person's slug",
	example: '525-christopher-nolan',
	type: String,
	nullable: true,
  })
  @Expose()
  @IsString()
  slug: string | null;

  @ApiProperty({
	description: "The person's URL",
	example: '/person/525-christopher-nolan',
	type: String,
	nullable: true,
  })
  @Expose()
  @IsUrl()
  url: string | null;
}

@ApiSchema({ name: 'PersonCompact' })
export class PersonCompactDto extends PickType(PersonDto, [
  'id',
  'name',
  'profile_path',
  'slug',
  'url',
] as const) {}
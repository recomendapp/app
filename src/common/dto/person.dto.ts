import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsInt, IsString, IsOptional, IsUrl, IsNumber } from 'class-validator';

@Exclude()
export class Person {
  @ApiProperty({ description: "The person's unique identifier", example: 525 })
  @Expose()
  @IsInt()
  id: number;

  @ApiPropertyOptional({
    description: "The person's name",
    example: 'Christopher Nolan',
  })
  @Expose()
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({
    description: "The person's profile image path",
    example: '/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg',
  })
  @Expose()
  @IsOptional()
  @IsString()
  profile_path?: string | null;

  @ApiPropertyOptional({
    description: "The person's profile image URL",
    example:
      'https://image.tmdb.org/t/p/original/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg',
  })
  @Expose()
  @IsOptional()
  @IsUrl()
  profile_url?: string | null;

  @ApiPropertyOptional({
    description: "The person's birthday",
    example: '1970-07-30',
  })
  @Expose()
  @IsOptional()
  @IsString()
  birthday?: string | null;

  @ApiPropertyOptional({ description: "The person's deathday", example: null })
  @Expose()
  @IsOptional()
  @IsString()
  deathday?: string | null;

  @ApiPropertyOptional({
    description: "The person's homepage URL",
    example: 'http://www.christophernolan.net',
  })
  @Expose()
  @IsOptional()
  @IsUrl()
  homepage?: string | null;

  @ApiPropertyOptional({
    description: "The person's imdb identifier",
    example: 'nm0634240',
  })
  @Expose()
  @IsOptional()
  @IsString()
  imdb_id?: string | null;

  @ApiPropertyOptional({
    description: "The person's kown for department",
    example: 'Directing',
  })
  @Expose()
  @IsOptional()
  @IsString()
  known_for_department?: string | null;

  @ApiPropertyOptional({
    description: "The person's place of birth",
    example: 'Westminster, London, England, UK',
  })
  @Expose()
  @IsOptional()
  @IsString()
  place_of_birth?: string | null;

  @ApiPropertyOptional({
    description:
      "The person's gender: 0 = Not specified, 1 = Female, 2 = Male, 3 = Non-binary",
    default: 0,
    example: 2,
  })
  @Expose()
  @IsOptional()
  @IsNumber()
  gender?: number | null;

  @ApiPropertyOptional({
    description: "The person's biography",
    example:
      'Christopher Nolan (born 30 July 1970) is a British-American filmmaker whose concept-driven epics have reshaped the modern studio blockbuster. Renowned for structurally intricate storytelling, large-format cinematography, and practical effects, he is widely regarded as a defining director of the 21st century. His films have grossed over $6.6 billion worldwide and earned him two Academy Awards, two BAFTAs, and a Golden Globe. He was appointed CBE in 2019 and knighted in 2024 for services to film.\n\nRaised between London and Evanston, Illinois, Nolan began making Super 8 shorts as a child, later studying English literature at University College London, where he ran the Film Society and met his producer and future wife, Emma Thomas; together they founded Syncopy Inc. After shorts like Doodlebug, he self-financed his micro-budget debut Following (1998), then broke through with the reverse-told amnesia noir Memento (2000). Studio work followed with Insomnia (2002) and then Batman Begins (2005), which launched a grounded superhero trilogy completed by The Dark Knight (2008) and The Dark Knight Rises (2012). Between and after those, he mounted original tentpoles—The Prestige (2006), Inception (2010), Interstellar (2014), and the triptych survival drama Dunkirk (2017), which earned his first Best Director nomination.\n\nNolan’s films interrogate time, memory, identity, ethics, and knowledge—sneaking metaphysics into genre frames (noir, heist, war, biopic). Hallmarks include nonlinear or braided timelines, precision cross-cutting, mathematically inflected imagery, practical/in-camera spectacle augmented by visual effects, experimental soundscapes, and a steadfast preference for celluloid (65mm/IMAX) and theatrical exhibition. A frequent collaborator with Jonathan Nolan (co-writer), Emma Thomas (producer), and craftspeople such as Wally Pfister, Hoyte van Hoytema, Lee Smith, and Hans Zimmer, he also advocates globally for film preservation and exhibition, curating restorations and convening archivists to champion photochemical cinema.\n\nAfter the time-bending espionage of Tenet (2020), Nolan departed Warner Bros. and partnered with Universal on Oppenheimer (2023), a morally dense biopic that won him the Academy Awards for Best Director and Best Picture. He is re-teaming with Universal on The Odyssey (scheduled for 2026), an IMAX-shot adaptation of Homer’s epic. In 2025 he was elected President of the Directors Guild of America. Nolan lives in Los Angeles with Thomas and their four children, continuing to pair popular spectacle with intellectual ambition while championing the artistry—and communal ritual—of seeing movies on film, in cinemas.',
  })
  @Expose()
  @IsOptional()
  @IsString()
  biography?: string | null;

  @ApiPropertyOptional({
    description: "The person's popularity score",
    example: 7.3643,
  })
  @Expose()
  @IsOptional()
  @IsNumber()
  popularity?: number | null;

  @ApiPropertyOptional({
    description: "The person's slug",
    example: '525-christopher-nolan',
  })
  @Expose()
  @IsOptional()
  @IsString()
  slug?: string | null;

  @ApiPropertyOptional({
    description: "The person's URL",
    example: '/person/525-christopher-nolan',
  })
  @Expose()
  @IsOptional()
  @IsUrl()
  url?: string | null;
}

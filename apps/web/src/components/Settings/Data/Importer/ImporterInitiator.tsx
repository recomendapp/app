import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { ImporterSource } from "./Importer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, SearchIcon, XIcon } from "lucide-react";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";

import LetterboxdParser from "./services/LetterboxdParser";
import { ScrollArea } from "@/components/ui/scroll-area";
// import ImporterResults from "./services/ImporterResults";
import { MediaMovie } from "@recomendapp/types";

export type ImportResults = {
	watchlist: {
		success: {
			date: string;
			source: {
				title: string;
				year: string;
				date: string;
			},
			movie: MediaMovie;
		}[];
		failed: any[];
	};
	user_movies: {
		success: {
			date: string;
			source: {
				title: string;
				year: string;
			},
			movie: MediaMovie;
			rating: number | null;
			liked: boolean;
		}[];
		failed: any[];
	};
	playlists: any[];
	success: boolean;
};

export const ImporterInitiator = ({
	sources,
	selectedSource,
	setSelectedSource,
	setModalOpen,
}: {
	sources: ImporterSource[];
	selectedSource: ImporterSource;
	setSelectedSource: (source: ImporterSource | null) => void;
	setModalOpen: (open: boolean) => void;
}) => {
	const [file, setFile] = useState<File | null>(null);
	const [importResults, setImportResults] = useState<ImportResults>({
		watchlist: {
			success: [],
			failed: [],
		},
		user_movies: {
			success: [],
			failed: [],
		},
		playlists: [],
		success: false,
	});
	const [watchlistIdsSkipped, setWatchlistIdsSkipped] = useState<number[]>([]);
	const [step, setStep] = useState(1);

	useEffect(() => {
		if (file) {
			setStep(2);
		} else {
			setStep(1);
		}
	}, [selectedSource, file]);

	return (
		<div className="bg-muted rounded-md space-y-2 p-4 overflow-hidden">
			<div className="flex items-center gap-2">
				<Button
					onClick={() => {
						if (step === 4 || step === 5) {
							setStep(3);
						} else if (step === 3) {
							setFile(null);
							setStep(1);
						} else if (step === 2) {
							setFile(null);
						} else if (step === 1) {
							setModalOpen(false);
							setSelectedSource(null);
						}
					}}
					variant="ghost"
					size="icon"
					className="rounded-full flex justify-center"
				>
					<ChevronLeft />
				</Button>
				{step === 1 ? (
					<Select
						defaultValue={selectedSource?.source}
						value={selectedSource?.source}
						onValueChange={(value) => {
							const source = sources.find((source) => source.source === value);
							if (source) {
								setSelectedSource(source);
							}
						}}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue

								placeholder="Source"
							/>
						</SelectTrigger>
						<SelectContent>
							{sources.sort((a, b) => a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1).map(source => (
								<SelectItem
									value={source.source}
									key={source.source}
									disabled={!source.enabled}
								>
									{source.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : step === 2 ? (
					<span className="font-medium">
						{selectedSource?.name}
					</span>
				) : (
					<span className="font-medium">
						Import Results
					</span>
				)}
			</div>
			{step === 1 || step === 2 || step === 4 ? (
				<div className="flex flex-col text-center justify-center h-32 px-4 transition bg-background border-2 border-muted border-dashed rounded-md appearance-none cursor-pointer hover:border-muted-hover focus:outline-hidden">
					{step === 1 && (
						<label>
							<span className="font-medium text-muted-foreground">
								Drop files to Attach, or{' '}
								<span className="text-accent-yellow underline">browse</span>
							</span>
							<Input
								type="file"
								name="file"
								className="hidden"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) {
										setFile(file);
									}
								}}
								accept={selectedSource?.fileTypes}
							/>
						</label>
					)}
					{step === 2 && (
						selectedSource.source === "letterboxd" ? (
							<LetterboxdParser
								file={file as File}
								setStep={setStep}
								importResults={importResults}
								setImportResults={setImportResults}
							/>
						) : (
							<span className="italic text-muted-foreground">Source not supported</span>
						)
					)}
					{/* { step === 4 && (
						<ImporterResults importResults={importResults} setStep={setStep} />
					)} */}
				</div>
			) : step === 3 ? (
				<div className="flex flex-col gap-2">
					<Accordion type="single" collapsible className="w-full bg-background p-4 rounded-md">
						<AccordionItem value="user_movies">
							<AccordionTrigger>Films</AccordionTrigger>
							<AccordionContent>
								<Tabs defaultValue="success" className="w-full">
									<TabsList className="grid w-full grid-cols-2">
										<TabsTrigger value="success">Success ({importResults.user_movies.success.length})</TabsTrigger>
										<TabsTrigger value="failed">Failed ({importResults.user_movies.failed.length})</TabsTrigger>
									</TabsList>
									<TabsContent value="success">
										<ScrollArea className="h-[50vh] pr-4">
											<div className="space-y-2">
												{importResults.user_movies.success.map((movie) => (
													<div key={movie.movie!.id} className="flex gap-2 items-center justify-between">
														{/* <MovieCard
															id={movie.movie!.id}
															title={movie.movie!.title}
															poster_url={`https://image.tmdb.org/t/p/original/${movie?.movie!.poster_path}`}
															release_date={movie.movie!.release_date}
															directors={movie.movie!.directors}
															rating={movie.rating}
															liked={movie.liked}
														/> */}
														<div className="shrink-0">
															<Button
																variant={'ghost'}
																size={'icon'}
															>
																<SearchIcon size={15} />
															</Button>
															<Button
																variant={'ghost'}
																size={'icon'}
															>
																<XIcon size={15} />
															</Button>
														</div>
													</div>
												))}
											</div>
										</ScrollArea>
									</TabsContent>
									<TabsContent value="failed">
										<ScrollArea className="h-[50vh]">
											{importResults.user_movies.failed.map((movie) => (
												<p key={movie.movie.id}>{movie.movie.title}</p>
											))}
										</ScrollArea>
									</TabsContent>
									</Tabs>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="watchlist">
							<AccordionTrigger>Watchlist</AccordionTrigger>
							<AccordionContent>
								<Tabs defaultValue="success" className="w-full">
									<TabsList className="grid w-full grid-cols-2">
										<TabsTrigger value="success">Success ({importResults.watchlist.success.length})</TabsTrigger>
										<TabsTrigger value="failed">Failed ({importResults.watchlist.failed.length})</TabsTrigger>
									</TabsList>
									<TabsContent value="success">
										<ScrollArea className="h-[50vh] pr-4">
											<div className="space-y-2">
												{importResults.watchlist.success.map((movie) => (
													<div key={movie.movie!.id} className="flex gap-2 items-center justify-between">
														{/* <MovieCard
															id={movie.movie!.id}
															title={movie.movie!.title}
															poster_url={`https://image.tmdb.org/t/p/original/${movie?.movie!.poster_path}`}
															release_date={movie.movie!.release_date}
															directors={movie.movie!.directors}
														/> */}
														<div className="shrink-0">
															<Button
																variant={'ghost'}
																size={'icon'}
															>
																<SearchIcon size={15} />
															</Button>
															<Button
																variant={'ghost'}
																size={'icon'}
															>
																<XIcon size={15} />
															</Button>
														</div>
													</div>
												))}
											</div>
										</ScrollArea>
									</TabsContent>
									<TabsContent value="failed">
										<ScrollArea className="h-[50vh]">
											{importResults.watchlist.failed.map((movie) => (
													<p key={movie.title}>{movie.title}</p>
											))}
										</ScrollArea>
									</TabsContent>
									</Tabs>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
					<Button
						onClick={() => {
							setStep(4);
						}}
					>
						Importer
					</Button>
				</div>
			) : (
				<div>
					Import Success
				</div>
			)}
		</div>
	)
}
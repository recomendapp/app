// import { useEffect, useState } from "react";
// import { ImportResults } from "../ImporterInitiator";
// import Loader from "@/components/Loader/Loader";
// import { useAuth } from "@/context/auth-context";
// import { useSupabaseClient } from '@/context/supabase-context';

// const ImporterResults = ({
// 	importResults,
// 	setStep,
// } : {
// 	importResults: ImportResults,
// 	setStep: (step: number) => void,
// }) => {
// 	const supabase = useSupabaseClient();
// 	const { user } = useAuth();
// 	const [loadingDots, setLoadingDots] = useState(".");
// 	const [importStep, setImportStep] = useState(1);
// 	const [importStepMsg, setImportStepMsg] = useState("Initializing");

// 	console.log("IMPORT RESULTS", importResults);
// 	useEffect(() => {
// 		const interval = setInterval(() => {
// 			setLoadingDots((dots) => {
// 				if (dots.length === 3) return ".";
// 				return dots + ".";
// 			});
// 		}, 500);
// 		return () => clearInterval(interval);
// 	}, []);

// 	useEffect(() => {
// 		if (importStep === 1) importMovies();
// 		else if (importStep === 2) importWatchlist();
// 		else if (importStep === 3) setStep(5);
// 	// eslint-disable-next-line react-hooks/exhaustive-deps
// 	}, [importStep]);

// 	const importMovies = async () => {
// 		if (!user) {
// 			setImportStepMsg("No user found");
// 			setStep(3);
// 			return;
// 		}
// 		if (importResults.user_movies.success.length < 1) {
// 			setImportStepMsg("No movies to import");
// 			setImportStep(2);
// 			return;
// 		}
// 		setImportStepMsg("Importing movies");
// 		const { error } = await supabase
// 			.from("user_activity")
// 			.upsert(importResults.user_movies.success.map(movie => ({
// 				user_id: user.id,
// 				movie_id: movie.movie!.id,
// 				liked: movie.liked,
// 				rating: movie.rating,
// 			})));
// 		if (error) {
// 			setImportStepMsg("Error importing movies");
// 			setImportStep(3);
// 			return;
// 		}
// 		setImportStepMsg("Movies imported successfully");
// 		setImportStep(2);
// 	};

// 	const importWatchlist = async () => {
// 		if (!user) {
// 			setImportStepMsg("No user found");
// 			setStep(3);
// 			return;
// 		}
// 		if (importResults.watchlist.success.length < 1) {
// 			setImportStepMsg("No watchlist to import");
// 			setImportStep(3);
// 			return;
// 		}
// 		setImportStepMsg("Importing watchlist");
// 		const { error } = await supabase
// 			.from("user_movie_watchlist")
// 			.upsert(importResults.watchlist.success.map(movie => ({
// 				user_id: user.id,
// 				movie_id: movie.movie!.id,
// 			})));
// 		if (error) {
// 			setImportStepMsg("Error importing watchlist");
// 			setImportStep(3);
// 			return;
// 		}
// 		setImportStepMsg("Watchlist imported successfully");
// 		setImportStep(3);
// 	};

// 	return (
// 		<div>
// 			<span className="italic text-muted-foreground">{importStepMsg}{loadingDots}</span>
// 			<Loader />
// 		</div>
// 	);
// }

// export default ImporterResults;
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { ImporterInitiator } from "./ImporterInitiator";
import { useTheme } from "next-themes";
import { ImageWithFallback } from "../../../utils/ImageWithFallback";
import { Progress } from "@/components/ui/progress";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { set } from "lodash";

export type ImporterSource = {
	source: string;
	name: string;
	description: string;
	icon: string;
	enabled: boolean;
	fileTypes: string;
};

export function Importer() {
	const [modalOpen, setModalOpen] = useState(false);
	const [selectedSource, setSelectedSource] = useState<ImporterSource | null>(null);

	const sources: ImporterSource[]= [
		{
			source: 'recomend',
			name: 'Recomend',
			description: 'Import your data from Recomend',
			icon: 'recomend',
			enabled: false,
			fileTypes: "json"
		},
		{
			source: 'letterboxd',
			name: 'Letterboxd',
			description: 'Import your data from Letterboxd',
			icon: 'letterboxd_vertical',
			enabled: false,
			fileTypes:  "zip, application/zip, application/x-zip-compressed, multipart/x-zip"
		},
		{
			source: 'senscritique',
			name: 'SensCritique',
			description: 'Import your data from SensCritique',
			icon: 'senscritique',
			enabled: false,
			fileTypes: "json"
		},
		{
			source: 'csv',
			name: 'CSV',
			description: 'Import your data from a CSV file',
			icon: 'csv',
			enabled: false,
			fileTypes: "csv"
		}
	];

	useEffect(() => {
		if (selectedSource) {
			setModalOpen(true);
		}
	}, [selectedSource]);
	return (
		<div className="space-y-6">
			<h3 className="text-lg font-medium">Importer</h3>
			<SelectSource sources={sources} selectedSource={selectedSource} setSelectedSource={setSelectedSource} />
			<AlertDialog open={modalOpen} onOpenChange={setModalOpen}>
				<AlertDialogContent className=" max-h-[98%] overflow-hidden flex flex-col">
					<ImporterInitiator
						sources={sources}
						selectedSource={selectedSource as ImporterSource}
						setSelectedSource={setSelectedSource}
						setModalOpen={setModalOpen}
					/>
					{/* <AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
						This action cannot be undone. This will permanently delete your
						account and remove your data from our servers.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction>Continue</AlertDialogAction>
					</AlertDialogFooter> */}
				</AlertDialogContent>
			</AlertDialog>
			{/* {step == 0 ? (
				<SelectSource sources={sources} selectedSource={selectedSource} setSelectedSource={setSelectedSource} />
			) : step == 1 ? (
				<ImporterInitiator
					sources={sources}
					selectedSource={selectedSource as ImporterSource}
					setSelectedSource={setSelectedSource}
					file={file}
					setFile={setFile}
				/>
			) : step == 2 ? (
				<div className="bg-muted rounded-md p-4 flex flex-col items-center gap-2">
					<span className="italic">Loading</span>
					<Progress value={50} />
				</div>
			) : (
				// show movies here (watched with rating and liked or not liked, watchlist, lists)
				<div>Import</div>
			)} */}
		</div>
	)
}

const SelectSource = ({
	sources,
	selectedSource,
	setSelectedSource
}: {
	sources: ImporterSource[];
	selectedSource: ImporterSource | null;
	setSelectedSource: (source: ImporterSource | null) => void;
}) => {
	const { theme } = useTheme();
	return (
		<div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
			{sources.sort((a, b) => a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1).map(source => (
				<Button
					variant={'outline'}
					key={source.source}
					disabled={!source.enabled}
					onClick={() => setSelectedSource(source)}
					className="relative flex flex-col items-center gap-2 aspect-square h-full overflow-hidden"
				>
					<ImageWithFallback
						src={`/icons/${theme}/${source.icon}.svg`}
						alt={source.name}
						fill
						sizes={`
							(max-width: 640px) 48px,
							(max-width: 1024px) 64px,
							80px
						`}
						type="service"
					/>
					{/* <p className="text-sm text-muted-foreground">{source.name}</p> */}
				</Button>
			))}
		</div>
	)
}

	
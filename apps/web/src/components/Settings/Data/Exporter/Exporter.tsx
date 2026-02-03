import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useState } from "react"
import { ImageWithFallback } from "../../../utils/ImageWithFallback";
import { useTheme } from "next-themes";

export type ExporterDestination = {
	destination: string;
	name: string;
	description: string;
	icon: string;
	enabled: boolean;
};

export function Exporter() {
	const { theme } = useTheme();
	const [selectedDestination, setSelectedDestination] = useState<ExporterDestination | null>(null);
	const destinations: ExporterDestination[]= [
		{
			destination: 'recomend',
			name: 'Recomend',
			description: 'Import your data from Recomend',
			icon: 'recomend',
			enabled: false,
		},
		{
			destination: 'letterboxd',
			name: 'Letterboxd',
			description: 'Import your data from Letterboxd',
			icon: 'letterboxd_vertical',
			enabled: false,
		},
		{
			destination: 'senscritique',
			name: 'SensCritique',
			description: 'Import your data from SensCritique',
			icon: 'senscritique',
			enabled: false,
		},
		{
			destination: 'csv',
			name: 'CSV',
			description: 'Import your data from a CSV file',
			icon: 'csv',
			enabled: false,
		}
	]

	return (
		<div className="space-y-6">
			<h3 className="text-lg font-medium">Exporter</h3>
			<div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
				{destinations.sort((a, b) => a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1).map(destination => (
					<Button
						variant={'outline'}
						key={destination.destination}
						disabled={!destination.enabled}
						onClick={() => setSelectedDestination(destination)}
						className="relative flex flex-col items-center gap-2 aspect-square h-full overflow-hidden"
					>
						<ImageWithFallback
							src={`/icons/${theme}/${destination.icon}.svg`}
							alt={destination.name}
							fill
							sizes={`
								(max-width: 640px) 48px,
								(max-width: 1024px) 64px,
								80px
							`}
							type="service"
						/>
						{/* <p className="text-sm text-muted-foreground">{destination.name}</p> */}
					</Button>
				))}
			</div>
		</div>
	)
}
	
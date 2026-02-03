import { Button } from '@/components/ui/button';
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from '@/components/ui/popover';
import { FilterIcon } from 'lucide-react';
import { MapFilterDate } from './MapFilterDate';
import { Separator } from '@/components/ui/separator';
import { MapFilterGenre } from './MapFilterGenre';
import { MapFilterActivity } from './MapFilterActivity';
import { MapFilterRuntime } from './MapFilterRuntime';
import { useAuth } from '@/context/auth-context';

export const MapFilters = () => {
	const { user } = useAuth();
	return (
		<div className="flex justify-end pointer-events-auto">
			<Popover>
				<PopoverTrigger asChild>
					<Button
					variant="outline"
					size="icon"
					className="relative h-8 w-8 rounded-full"
					>
						<FilterIcon className="h-4 w-4"/>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-80 mr-4" align='start'>
					<MapFilterDate />
					<Separator />
					<MapFilterRuntime />
					<Separator />
					<MapFilterGenre />
					{user && (
						<>
							<Separator />
							<MapFilterActivity />
						</>
					)}
				</PopoverContent>
				</Popover>
		</div>
	)
}
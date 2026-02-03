import { FormItem } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { useMap } from "../../../../context/map-context"
import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcwIcon } from "lucide-react"
import { TooltipBox } from "@/components/Box/TooltipBox"
import { useTranslations } from "next-intl"
import { upperFirst } from "lodash"

export const MapFilterGenre = () => {
	const t = useTranslations();
	const {
		data,
		filters
	} = useMap();

	const handleReset = useCallback(() => {
		filters.genres.setValue([]);
	}, [filters.genres]);

	const handleSelect = useCallback((genreId: number) => {
		const newGenres = [...filters.genres.value];
		const index = newGenres.indexOf(genreId);
		if (index > -1) {
			newGenres.splice(index, 1);
		} else {
			newGenres.push(genreId);
		}
		filters.genres.setValue(newGenres);
	}, [filters.genres]);

	return (
		<FormItem>
			<Label className="inline-flex items-center gap-2">
				{upperFirst(t('common.messages.genre', { count: 2 }))}
				{filters.genres.value.length > 0 &&
					<TooltipBox tooltip="Reset">
						<Button variant={'outline'} size={'icon-sm'} onClick={handleReset}>
							<RotateCcwIcon />
						</Button>
					</TooltipBox>
				}
			</Label>
			<div className="space-x-2 space-y-2">
				{data?.genres.map((genre) => (
					<Button
					key={genre.id}
					variant={filters.genres.value.includes(genre.id) ? 'default' : 'outline'}
					onClick={() => handleSelect(genre.id)}
					>
						{genre.name}
					</Button>
				))}
			</div>
		</FormItem>
	)
}
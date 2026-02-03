import { FormItem } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { useMap } from "../../../../context/map-context"
import { useEffect, useState } from "react"
import useDebounce from "@/hooks/use-debounce"
import { Checkbox } from "@/components/ui/checkbox"

export const MapFilterActivity = () => {
	const {
		filters
	} = useMap();
	const [hideWatched, setHideWatched] = useState(filters.activity.hideWatched.value ?? false);
	const debouncedValue = useDebounce(hideWatched, 500);


	useEffect(() => {
		if (debouncedValue !== filters.activity.hideWatched.value)
			filters.activity.hideWatched.setValue(debouncedValue);
	}, [debouncedValue, filters.activity.hideWatched]);

	return (
		<FormItem>
			<Label>Activité</Label>
			<div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="hide-watched"
						checked={hideWatched}
						onCheckedChange={(value) => {
							setHideWatched(value)
						}}
						disabled
					/>
					<label
						htmlFor="terms"
						className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						Masquer les films déjà vus
					</label>
				</div>

			</div>
		</FormItem>
	)
}
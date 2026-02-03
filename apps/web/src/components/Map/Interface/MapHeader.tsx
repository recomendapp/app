import { MapFilters } from "./MapFilters"
import { MapSearchbar } from "./MapSearchbar"

export const MapHeader = () => {
	return (
		<div className="gap-2  w-full flex flex-col md:items-center md:flex-row">
          <MapSearchbar />
		  <MapFilters />
        </div>
	)
}
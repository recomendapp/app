import { UiBackgroundWithMovie, UiBackgroundWithTvSeries } from "./__generated__";

export type UiBackground = (
    | ({ type: 'movie' } & UiBackgroundWithMovie)
    | ({ type: 'tv_series' } & UiBackgroundWithTvSeries)
);
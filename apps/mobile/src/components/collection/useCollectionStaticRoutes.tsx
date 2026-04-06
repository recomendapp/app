import { useMemo } from "react";
import CollectionIcon from "./CollectionIcon";
import { Icons } from "apps/mobile/src/constants/Icons";
import { capitalize } from "lodash";
import { Href } from "expo-router";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { useTranslations } from "use-intl";

interface CollectionStaticRoute {
	type: 'static';
	icon: React.ReactNode;
	label: string;
	href: Href;
}

const useCollectionStaticRoutes = () => {
	const t = useTranslations();
	const { colors } = useTheme();
	const routes = useMemo((): CollectionStaticRoute[] => [
		{
			type: 'static',
			icon: (
				<CollectionIcon from="#FBE773" to="#F18E43">
					<Icons.Reco color={colors.white} fill={colors.white} className="w-2/5 h-2/5" />
				</CollectionIcon>
			),
			label: capitalize(t('common.messages.my_recos')),
			href: { pathname: '/collection/my-recos'},
		},
		{
			type: 'static',
			icon: (
				<CollectionIcon from="#39BAED" to="#32509e">
					<Icons.Bookmark color={colors.white} fill={colors.white}  className="w-2/5 h-2/5" />
				</CollectionIcon>
			),
			label: capitalize(t('common.messages.for_later')),
			href: { pathname: '/collection/bookmarks' },
		},
	], [t, colors]);
	return routes;
};

export default useCollectionStaticRoutes;
export type {
	CollectionStaticRoute
}
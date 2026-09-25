import { useMemo } from 'react';
import CollectionIcon from './CollectionIcon';
import { Icons } from '../../constants/Icons';
import { capitalize } from 'lodash';
import { Href } from 'expo-router';
import { useTheme } from '../../providers/ThemeProvider';
import { useTranslations } from 'use-intl';
import Color from 'color';

interface CollectionStaticRoute {
  type: 'static';
  icon: React.ReactNode;
  label: string;
  href: Href;
}

const useCollectionStaticRoutes = () => {
  const t = useTranslations();
  const { colors } = useTheme();

  const routes = useMemo(
    (): CollectionStaticRoute[] => [
      {
        type: 'static',
        icon: (
          <CollectionIcon
            from={Color(colors.accentYellow).hex()}
            to={Color(colors.accentYellow).rotate(-30).darken(0.1).hex()}
          >
            <Icons.Reco color={colors.white} fill={colors.white} width="20%" height="20%" />
          </CollectionIcon>
        ),
        label: capitalize(t('common.messages.my_recos')),
        href: { pathname: '/collection/my-recos' },
      },
      {
        type: 'static',
        icon: (
          <CollectionIcon
            from={Color(colors.accentBlue).hex()}
            to={Color(colors.accentBlue).rotate(-30).darken(0.1).hex()}
          >
            <Icons.Bookmark color={colors.white} fill={colors.white} width="20%" height="20%" />
          </CollectionIcon>
        ),
        label: capitalize(t('common.messages.for_later')),
        href: { pathname: '/collection/bookmarks' },
      },
    ],
    [t, colors],
  );

  return routes;
};

export default useCollectionStaticRoutes;
export type { CollectionStaticRoute };

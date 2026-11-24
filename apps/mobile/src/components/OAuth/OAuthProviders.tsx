import { DimensionValue, View, ViewProps, ViewStyle } from 'react-native';
import { Button } from '../ui/Button';
import { Text } from '../ui/text';
import { useMemo } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { Icons } from '../../constants/Icons';
import { BrandIcon, BrandIconProps } from '../../lib/icons';
import { SocialProvider } from 'better-auth/types';

type Provider = {
  name: SocialProvider;
  label: string;
  icon: { component: BrandIcon; variant?: BrandIconProps['variant'] };
};

interface OAuthProvidersProps extends ViewProps {
  data?: Provider[];
  numColumns?: number;
  itemStyle?: ViewStyle;
  /** Drops the labels for a centered row of square icon buttons. */
  iconOnly?: boolean;
}

export const OAuthProviders = ({
  data,
  numColumns = 2,
  itemStyle,
  iconOnly = false,
  style,
  ...props
}: OAuthProvidersProps) => {
  const { loginWithOAuth } = useAuth();
  const { colors, mode, theme } = useTheme();

  const providers = useMemo(
    (): Provider[] =>
      data || [
        {
          name: 'google',
          label: 'Google',
          icon: { component: Icons.brands.google },
        },
        {
          name: 'apple',
          label: 'Apple',
          icon: { component: Icons.brands.apple, variant: mode },
        },
        {
          name: 'facebook',
          label: 'Facebook',
          icon: { component: Icons.brands.facebook },
        },
        {
          name: 'github',
          label: 'GitHub',
          icon: { component: Icons.brands.github, variant: mode },
        },
      ],
    [mode, data],
  );

  const iconSize = iconOnly ? theme.icons.sizes.md : 18;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spaces.md,
          ...(iconOnly ? { justifyContent: 'center', alignItems: 'center' } : {}),
        },
        style,
      ]}
      {...props}
    >
      {providers.map((provider) => (
        <Button
          key={provider.name}
          variant="muted"
          size={iconOnly ? 'icon' : 'default'}
          onPress={() => loginWithOAuth(provider.name)}
          accessibilityLabel={iconOnly ? provider.label : undefined}
          style={iconOnly ? { borderRadius: theme.border.radius.full } : undefined}
          // Square buttons keep their own size; labelled ones grow from nothing
          // so the gap is never squeezed, their minimum width being what forces
          // the wrap into `numColumns` per row. It has to land on the container
          // because that is the flex child here -- `style` goes to the button's
          // inner view.
          containerStyle={
            iconOnly
              ? itemStyle
              : {
                  flexGrow: 1,
                  flexBasis: 0,
                  minWidth: `${80 / numColumns}%` as DimensionValue,
                  ...itemStyle,
                }
          }
        >
          <provider.icon.component
            width={iconSize}
            height={iconSize}
            variant={provider.icon.variant}
          />
          {!iconOnly && <Text style={{ color: colors.foreground }}>{provider.label}</Text>}
        </Button>
      ))}
    </View>
  );
};

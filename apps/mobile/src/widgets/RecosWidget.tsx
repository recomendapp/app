import { Button, HStack, Image, Link, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  aspectRatio,
  background,
  buttonStyle,
  clipped,
  containerBackground,
  containerRelativeFrame,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  resizable,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { WidgetCarouselItem, WidgetCarouselProps, WidgetOrderConfiguration } from './types';

const RecosWidget = (
  props: WidgetCarouselProps,
  environment: WidgetEnvironment<WidgetOrderConfiguration>,
) => {
  'widget';

  const edgePadding = 10;
  const navButtonWidth = 32;
  const scrim = 'rgba(0,0,0,0.5)';
  const accentColor = props.accentColor || '#FFEA75';

  const orderItems = (items: WidgetCarouselItem[]): WidgetCarouselItem[] => {
    if (environment.configuration?.order !== 'random') return items;

    let hash = 0;
    const seedSource = `${environment.date.getFullYear()}-${environment.date.getMonth()}-${environment.date.getDate()}`;
    for (let i = 0; i < seedSource.length; i++) {
      hash = (hash << 5) - hash + seedSource.charCodeAt(i);
      hash |= 0;
    }
    let seed = Math.abs(hash) % 2147483647 || 1;
    const next = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const shuffled = items.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      const tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    return shuffled;
  };

  const items = orderItems(props.items);
  const backgroundColor = environment.colorScheme === 'dark' ? '#0b0909' : '#ffffff';
  const label = (props.label || 'Recos').toUpperCase();

  if (items.length === 0) {
    return (
      <ZStack modifiers={[containerBackground(backgroundColor, 'widget')]}>
        <VStack alignment="center" spacing={6} modifiers={[padding({ all: 12 })]}>
          <Text
            modifiers={[
              font({ size: 11, weight: 'bold' }),
              foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
            ]}
          >
            {label}
          </Text>
          <Text
            modifiers={[
              font({ size: 13 }),
              foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
            ]}
          >
            No recos yet
          </Text>
        </VStack>
      </ZStack>
    );
  }

  const currentIndex = (((props.currentIndex ?? 0) % items.length) + items.length) % items.length;
  const item = items[currentIndex];
  const prevIndex = (currentIndex - 1 + items.length) % items.length;
  const nextIndex = (currentIndex + 1) % items.length;
  const goTo = (index: number) =>
    (() => ({
      items: props.items,
      label: props.label,
      accentColor: props.accentColor,
      currentIndex: index,
    })) as unknown as () => void;

  return (
    <ZStack modifiers={[containerBackground(backgroundColor, 'widget')]}>
      {/* Background art, edge to edge, no padding. */}
      {item.backdropUri ? (
        <Image
          uiImage={item.backdropUri}
          modifiers={[
            resizable(),
            aspectRatio({ contentMode: 'fill' }),
            containerRelativeFrame({ axes: 'both' }),
            clipped(),
          ]}
        />
      ) : (
        <VStack
          alignment="center"
          modifiers={[
            containerRelativeFrame({ axes: 'both' }),
            background('rgba(127,127,127,0.18)'),
          ]}
        >
          <Image systemName="photo" size={22} color="rgba(127,127,127,0.6)" />
        </VStack>
      )}

      {/* One overlay, one inset: badge top-leading, title pill bottom-center. */}
      <VStack
        alignment="leading"
        modifiers={[padding({ all: edgePadding }), containerRelativeFrame({ axes: 'both' })]}
      >
        <HStack
          spacing={4}
          alignment="center"
          modifiers={[
            padding({ horizontal: 8, vertical: 4 }),
            background(scrim, shapes.capsule({})),
          ]}
        >
          <Image systemName="sparkles" size={10} color={accentColor} />
          <Text modifiers={[font({ size: 10, weight: 'bold' }), foregroundStyle('#ffffff')]}>
            {label}
          </Text>
        </HStack>
        <Spacer />
        <HStack modifiers={[frame({ maxWidth: 1000 })]}>
          <Spacer />
          <VStack
            alignment="center"
            spacing={1}
            modifiers={[
              padding({ horizontal: 10, vertical: 6 }),
              background(scrim, shapes.capsule({})),
            ]}
          >
            <Text
              modifiers={[
                font({ size: 13, weight: 'bold' }),
                foregroundStyle('#ffffff'),
                lineLimit(1),
              ]}
            >
              {item.title}
            </Text>
            {item.subtitle ? (
              <Text
                modifiers={[
                  font({ size: 10 }),
                  foregroundStyle('rgba(255,255,255,0.8)'),
                  lineLimit(1),
                ]}
              >
                {item.subtitle}
              </Text>
            ) : null}
          </VStack>
          <Spacer />
        </HStack>
      </VStack>

      {/* Interactive controls, same edge inset. Kept in its own row (rather than
          layered under the badge/title above) so WidgetKit's rectangular tap
          regions for the buttons and the open-film link never overlap — when
          they did, button taps were dispatched to the link most of the time. */}
      <HStack
        spacing={0}
        alignment="center"
        modifiers={[padding({ horizontal: edgePadding }), containerRelativeFrame({ axes: 'both' })]}
      >
        {items.length > 1 ? (
          <Button onPress={goTo(prevIndex)} modifiers={[buttonStyle('plain')]}>
            <VStack
              alignment="center"
              modifiers={[
                frame({ width: navButtonWidth, height: navButtonWidth }),
                background('rgba(0,0,0,0.4)', shapes.circle()),
              ]}
            >
              <Image systemName="chevron.left" size={13} color="#ffffff" />
            </VStack>
          </Button>
        ) : (
          <VStack modifiers={[frame({ width: navButtonWidth })]}>{null}</VStack>
        )}
        <Link destination={item.deepLink}>
          <VStack modifiers={[frame({ maxWidth: 1000, maxHeight: 1000 })]}>{null}</VStack>
        </Link>
        {items.length > 1 ? (
          <Button onPress={goTo(nextIndex)} modifiers={[buttonStyle('plain')]}>
            <VStack
              alignment="center"
              modifiers={[
                frame({ width: navButtonWidth, height: navButtonWidth }),
                background('rgba(0,0,0,0.4)', shapes.circle()),
              ]}
            >
              <Image systemName="chevron.right" size={13} color="#ffffff" />
            </VStack>
          </Button>
        ) : (
          <VStack modifiers={[frame({ width: navButtonWidth })]}>{null}</VStack>
        )}
      </HStack>
    </ZStack>
  );
};

export default createWidget<WidgetCarouselProps, WidgetOrderConfiguration>(
  'RecosWidget',
  RecosWidget,
);

'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@libs/ui/components/alert-dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@libs/ui/components/carousel';
import { Button } from '@libs/ui/components/button';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@libs/ui/components/avatar';
import { Skeleton } from '@libs/ui/components/skeleton';
import { HeaderBox } from '@/components/Box/HeaderBox';
import { TooltipBox } from '@/components/Box/TooltipBox';
import {
  importSourcesListAllOptions,
  uiFeaturesOptions,
  useMeUpdateMutation,
} from '@libs/query-client';
import { Icons } from '@/config/icons';
import { Images } from '@/config/images';
import { siteConfig } from '@/config/site';
import { useRandomImage } from '@/hooks/use-random-image';
import { Link } from '@/lib/i18n/navigation';
import { useQuery } from '@tanstack/react-query';
import { upperFirst } from 'lodash';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@libs/ui/components/card';
import { useRef } from 'react';
import Autoplay from 'embla-carousel-autoplay';

interface ModalWelcomeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseEnd?: () => void;
}

export const ModalWelcome = ({ open, onOpenChange, onCloseEnd }: ModalWelcomeProps) => {
  const t = useTranslations();
  const { mutate: updateMe } = useMeUpdateMutation();
  const { data: features, isLoading } = useQuery(uiFeaturesOptions());
  const bgImage = useRandomImage(Images.welcome.background);

  const markWelcomed = () => updateMe({ body: { welcomed: true } });

  const autoplay = useRef(
    Autoplay({
      delay: 20000,
    }),
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) markWelcomed();
    onOpenChange(nextOpen);
  };

  const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && event.currentTarget.dataset.state === 'closed') {
      onCloseEnd?.();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onAnimationEnd={handleAnimationEnd} className="p-0 gap-0 overflow-hidden">
        <HeaderBox
          className="h-40 sm:h-48 items-center"
          background={
            bgImage ? { src: bgImage.src, alt: bgImage.alt ?? '', unoptimized: true } : undefined
          }
        >
          <Icons.site.logo className="fill-accent-yellow w-1/2 self-center" />
        </HeaderBox>

        <div className="flex flex-col gap-4 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-3xl w-full">
              {upperFirst(t('pages.welcome.title'))}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center w-full">
              {t('pages.welcome.description', { app: siteConfig.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {features === undefined || isLoading ? (
            <Skeleton className="h-full aspect-video rounded-md" />
          ) : (
            <Carousel
              opts={{
                loop: true,
              }}
              className="w-full"
              plugins={[autoplay.current]}
              onMouseEnter={autoplay.current.stop}
              onMouseLeave={() => autoplay.current.play()}
            >
              <CarouselContent>
                {(features ?? []).map((feature) => (
                  <CarouselItem key={feature.key}>
                    <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                      <video
                        className="absolute inset-0 h-full w-full object-cover"
                        poster={feature.poster.default}
                        autoPlay
                        muted
                        loop
                        playsInline
                      >
                        <source src={feature.video.webm} type="video/webm" />
                        <source src={feature.video.default} type="video/mp4" />
                      </video>
                      <TooltipBox
                        tooltip={{
                          children: (
                            <div className="max-w-56">
                              <p className="font-medium">{feature.label}</p>
                              <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                          ),
                        }}
                      >
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="absolute bottom-2 right-2 rounded-full bg-background/80 backdrop-blur"
                        >
                          <Icons.info className="w-4 h-4" />
                          <span className="sr-only">{feature.label}</span>
                        </Button>
                      </TooltipBox>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 rounded-full bg-background/80 backdrop-blur" />
              <CarouselNext className="right-2 rounded-full bg-background/80 backdrop-blur" />
            </Carousel>
          )}
          <Card>
            <CardHeader>
              <CardAction>
                <Button variant="outline" asChild onClick={() => handleOpenChange(false)}>
                  <Link href="/settings/data">{upperFirst(t('common.messages.import'))}</Link>
                </Button>
              </CardAction>
              <CardTitle>{upperFirst(t('pages.welcome.import.title'))}</CardTitle>
              <CardDescription>
                <ImportSourcesPreview />
              </CardDescription>
            </CardHeader>
          </Card>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => handleOpenChange(false)} className="w-full">
              {upperFirst(t('common.messages.get_started'))}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const MAX_VISIBLE_SOURCES = 3;

const ImportSourcesPreview = () => {
  const { theme } = useTheme();
  const { data: sources, isLoading } = useQuery(importSourcesListAllOptions());

  if (isLoading) {
    return <Skeleton className="h-10 w-32 rounded-md" />;
  }

  if (!sources?.length) return null;

  const visibleSources = sources.slice(0, MAX_VISIBLE_SOURCES);
  const remaining = sources.length - visibleSources.length;

  return (
    <AvatarGroup>
      {visibleSources.map((source) => (
        <Avatar key={source.provider.slug} size="lg" className="rounded-md">
          <AvatarImage
            src={
              (theme === 'dark' ? source.provider.iconDark : source.provider.iconLight) ?? undefined
            }
            alt={source.provider.name}
          />
          <AvatarFallback>{source.provider.name.charAt(0)}</AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && <AvatarGroupCount className="rounded-md">+{remaining}</AvatarGroupCount>}
    </AvatarGroup>
  );
};

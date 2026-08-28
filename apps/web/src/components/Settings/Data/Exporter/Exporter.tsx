'use client';

import { Button } from '@libs/ui/components/button';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { exportSourcesListAllOptions } from '@libs/query-client';
import { ImportSource } from '@libs/api-js';
import { ImageWithFallback } from '../../../utils/ImageWithFallback';
import { useTheme } from 'next-themes';

export type ExporterDestination = {
  destination: string;
  name: string;
  description: string;
  iconLight: string | null;
  iconDark: string | null;
  enabled: boolean;
};

export function Exporter({ initialDestinations }: { initialDestinations: ImportSource[] }) {
  const { theme } = useTheme();
  const [selectedDestination, setSelectedDestination] = useState<ExporterDestination | null>(null);

  const { data: destinationsData } = useQuery({
    ...exportSourcesListAllOptions(),
    initialData: initialDestinations,
  });
  const destinations: ExporterDestination[] = (destinationsData ?? []).map((destination) => ({
    destination: destination.provider,
    name: destination.name,
    description: destination.description ?? '',
    iconLight: destination.iconLight ?? null,
    iconDark: destination.iconDark ?? null,
    enabled: destination.enabled,
  }));

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Exporter</h3>
      {destinations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No export destination is available yet.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {destinations
            .sort((a, b) => (a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1))
            .map((destination) => (
              <Button
                variant={'outline'}
                key={destination.destination}
                disabled={!destination.enabled}
                onClick={() => setSelectedDestination(destination)}
                className="relative flex flex-col items-center gap-2 aspect-square h-full overflow-hidden"
              >
                <ImageWithFallback
                  src={theme === 'dark' ? destination.iconDark : destination.iconLight}
                  alt={destination.name}
                  fill
                  sizes={`
									(max-width: 640px) 48px,
									(max-width: 1024px) 64px,
									80px
								`}
                  type="service"
                />
              </Button>
            ))}
        </div>
      )}
    </div>
  );
}

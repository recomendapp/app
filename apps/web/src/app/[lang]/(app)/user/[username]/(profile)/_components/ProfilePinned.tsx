'use client';
import { useState, useEffect, useCallback, forwardRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  userPinnedOptions,
  useUserPinnedDeleteMutation,
  useUserPinnedReorderMutation,
} from '@libs/query-client';
import { useAuth } from '@/context/auth-context';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ContextMenuPlaylist } from '@/components/ContextMenu/ContextMenuPlaylist';
import { ContextMenuMovie } from '@/components/ContextMenu/ContextMenuMovie';
import { ContextMenuTvSeries } from '@/components/ContextMenu/ContextMenuTvSeries';
import { ScrollArea, ScrollBar } from '@libs/ui/components/scroll-area';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import toast from 'react-hot-toast';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { useRouter } from '@/lib/i18n/navigation';
import { Icons } from '@/config/icons';
import { Button } from '@libs/ui/components/button';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { ImageWithFallback } from '@/components/utils/ImageWithFallback';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { useModal } from '@/context/modal-context';

const PinnedItemCard = forwardRef<
  HTMLDivElement,
  {
    item: NonNullable<
      Awaited<ReturnType<NonNullable<ReturnType<typeof userPinnedOptions>['queryFn']>>>
    >[number];
  } & React.HTMLAttributes<HTMLDivElement>
>(({ item, ...props }, ref) => {
  const t = useTranslations();
  const title =
    (item.type === 'movie'
      ? item.data.title
      : item.type === 'tv_series'
        ? item.data.name
        : item.type === 'person'
          ? item.data.name
          : item.type === 'playlist'
            ? item.data
              ? item.data.title
              : t('common.messages.not_found')
            : null) || '';
  const image =
    (item.type === 'movie'
      ? getTmdbImage({ path: item.data.posterPath, size: 'w92' })
      : item.type === 'tv_series'
        ? getTmdbImage({ path: item.data.posterPath, size: 'w92' })
        : item.type === 'person'
          ? getTmdbImage({ path: item.data.profilePath, size: 'w92' })
          : item.type === 'playlist'
            ? item.data?.poster
            : null) || '';
  return (
    <div
      ref={ref}
      {...props}
      className={`
        gap-2 items-center w-20
        ${item.status !== 'available' ? 'opacity-50' : ''}
      `}
    >
      <div
        className={'relative w-full rounded-md overflow-hidden aspect-square border-2 border-muted'}
      >
        <ImageWithFallback
          src={image}
          alt={title}
          fill
          className="object-cover"
          type={item.type}
          unoptimized
        />
      </div>
      <p className="text-center truncate text-sm">{title}</p>
    </div>
  );
});
PinnedItemCard.displayName = 'PinnedItemCard';

const SortablePinnedItem = ({
  item,
  disabled,
  onRemove,
}: {
  item: NonNullable<
    Awaited<ReturnType<NonNullable<ReturnType<typeof userPinnedOptions>['queryFn']>>>
  >[number];
  disabled: boolean;
  onRemove: (id: number) => void;
}) => {
  const router = useRouter();
  const t = useTranslations();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const tooltip =
    item.status === 'over_limit'
      ? t('common.messages.limit_reached', { count: 1 })
      : item.status === 'unavailable'
        ? t('common.messages.unavailable')
        : undefined;

  const handleClick = useCallback(() => {
    if (!item.data) return;
    switch (item.type) {
      case 'movie':
        router.push({ pathname: `/film/${item.data.slug || item.data.id}` });
        break;
      case 'tv_series':
        router.push({ pathname: `/tv-series/${item.data.slug || item.data.id}` });
        break;
      case 'person':
        router.push({ pathname: `/person/${item.data.slug || item.data.id}` });
        break;
      case 'playlist':
        router.push({ pathname: `/playlist/${item.data.id}` });
        break;
    }
  }, [item, router]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`relative group ${
        !disabled ? 'cursor-grab active:cursor-grabbing touch-none' : ''
      }`}
    >
      {!disabled && (
        <Button
          variant={'outline'}
          size={'icon-xs'}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(Number(item.id));
          }}
          className="absolute top-1 right-1 z-20 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
        >
          <Icons.X />
        </Button>
      )}
      {item.type === 'movie' ? (
        <ContextMenuMovie movie={item.data}>
          <TooltipBox tooltip={tooltip}>
            <PinnedItemCard item={item} />
          </TooltipBox>
        </ContextMenuMovie>
      ) : item.type === 'tv_series' ? (
        <ContextMenuTvSeries tvSeries={item.data}>
          <TooltipBox tooltip={tooltip}>
            <PinnedItemCard item={item} />
          </TooltipBox>
        </ContextMenuTvSeries>
      ) : item.type === 'person' ? (
        <TooltipBox tooltip={tooltip}>
          <PinnedItemCard item={item} />
        </TooltipBox>
      ) : item.type === 'playlist' ? (
        item.data ? (
          <ContextMenuPlaylist playlist={item.data}>
            <TooltipBox tooltip={tooltip}>
              <PinnedItemCard item={item} />
            </TooltipBox>
          </ContextMenuPlaylist>
        ) : (
          <TooltipBox tooltip={tooltip}>
            <PinnedItemCard item={item} />
          </TooltipBox>
        )
      ) : null}
    </div>
  );
};

export const ProfilePinned = ({ profileId }: { profileId: string }) => {
  const { user } = useAuth();
  const t = useTranslations();
  const { data: pinnedItems } = useQuery(userPinnedOptions({ userId: profileId }));
  const { createConfirmModal } = useModal();
  const { mutateAsync: reorderPinned } = useUserPinnedReorderMutation();
  const { mutateAsync: deletePinned } = useUserPinnedDeleteMutation();

  const [items, setItems] = useState<NonNullable<typeof pinnedItems>>([]);

  const isOwner = user?.id === profileId;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleRemove = useCallback(
    (idToRemove: number) =>
      createConfirmModal({
        title: t('common.messages.are_u_sure'),
        onConfirm: async () => {
          const previousItems = items;
          setItems((current) => current.filter((i) => i.id !== idToRemove));

          await deletePinned(
            {
              body: { itemIds: [idToRemove] },
            },
            {
              onSuccess: () =>
                toast.success(t('common.messages.unpinned', { gender: 'male', count: 1 })),
              onError: () => {
                setItems(previousItems);
                toast.error(upperFirst(t('common.messages.an_error_occurred')));
              },
            },
          );
        },
      }),
    [items, deletePinned, t, createConfirmModal],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const previousItems = items;
      setItems(arrayMove(items, oldIndex, newIndex));

      await reorderPinned(
        {
          path: {
            pinned_item_id: Number(active.id),
          },
          body: {
            position: newIndex + 1,
          },
        },
        {
          onError: () => {
            setItems(previousItems);
            toast.error(upperFirst(t('common.messages.an_error_occurred')));
          },
        },
      );
    },
    [items, reorderPinned, toast, t],
  );

  useEffect(() => {
    if (pinnedItems) {
      setItems(pinnedItems);
    }
  }, [pinnedItems]);

  if (!items.length) return null;

  return (
    <ScrollArea className="rounded-md">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToHorizontalAxis]}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="flex gap-2">
            {items.map((item) => (
              <SortablePinnedItem
                key={item.id}
                item={item}
                disabled={!isOwner}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <ScrollBar orientation="horizontal" className="hidden" />
    </ScrollArea>
  );
};

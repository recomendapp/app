'use client'

import React, { useMemo } from 'react';
import { PlaylistCreateButton } from '@/components/Playlist/Button/PlaylistCreateButton';
import { Link } from "@/lib/i18n/navigation";
import { Bookmark, Heart, Send } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { UserPlaylistsSaved } from './UserPlaylistsSaved';
import CollectionIcon from '@/components/Collection/CollectionIcon';
import { useUI } from '@/context/ui-context';
import HeaderRightSide from '@/components/Header/HeaderRightSide';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { UserPlaylists } from './UserPlaylists';

const Collection = () => {
  const { device } = useUI();
  const t = useTranslations('common');
  const collectionRoutes = useMemo(
	() => [
	  {
		icon: (
		  <CollectionIcon from="#FBE773" to="#F18E43">
			<Send fill="#fff" className="w-2/5 h-2/5" />
		  </CollectionIcon>
		),
		label: upperFirst(t('messages.my_recos')),
		href: '/collection/my-recos',
	  },
	  {
		icon: (
		  <CollectionIcon from="#39BAED" to="#32509e">
			<Bookmark fill="#fff" className="w-2/5 h-2/5" />
		  </CollectionIcon>
		),
		label: upperFirst(t('messages.watchlist')),
		href: '/collection/watchlist',
	  },
	  {
		icon: (
		  <CollectionIcon from="#e6619b" to="#e84749">
			<Heart fill="#fff" className="w-2/5 h-2/5" />
		  </CollectionIcon>
		),
		label: upperFirst(t('messages.heart_pick', { count: 2 })),
		href: '/collection/heart-picks',
	  },
	],
	[t]
  );
  return (
	<div className="h-full @container/collection overflow-y-auto relative">
	  {device === "mobile" ? <div className="flex justify-between items-center w-full p-4 sticky top-0">
		<div className="flex gap-2 items-center">
		  <div className="text-2xl font-bold">Bibliothèque</div>
		  <PlaylistCreateButton />
		</div>
		<HeaderRightSide />
	  </div> : null}
	  <Tabs defaultValue="personal" className='p-4'>
		<TabsList className="grid grid-cols-2 max-w-[400px]">
		  <TabsTrigger value="personal">Ma Bibliothèque</TabsTrigger>
		  <TabsTrigger value="external">Enregistré</TabsTrigger>
		</TabsList>
		<TabsContent value="personal" className="grid gap-2 grid-cols-3 @md/collection:grid-cols-4 @2xl/collection:grid-cols-6 @4xl/collection:grid-cols-8 @6xl/collection:grid-cols-10 @7xl/collection:grid-cols-12">
		  {collectionRoutes.map((item, i) => (
			<Link key={i} href={item.href} className="group h-full w-full flex flex-col gap-2 text-center line-clamp-2">
			{item.icon}
			{item.label}
			</Link>
		  ))}
		  <UserPlaylists grid />
		</TabsContent>
		<TabsContent value="external" className="grid gap-2 grid-cols-3 @md/collection:grid-cols-4 @2xl/collection:grid-cols-6 @4xl/collection:grid-cols-8 @6xl/collection:grid-cols-10 @7xl/collection:grid-cols-12">
		  <UserPlaylistsSaved sidebarExpanded={false} grid />
		</TabsContent>
	  </Tabs>
	</div>
  );
}

export default Collection;
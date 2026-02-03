import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { truncate, upperFirst } from 'lodash';
import { siteConfig } from '@/config/site';
import { Metadata } from 'next';
import { generateAlternates } from '@/lib/i18n/routing';
import { Playlist } from './_components/Playlist';
import { SupportedLocale } from '@/translations/locales';
import { getPlaylist } from '@/api/server/playlists';

export async function generateMetadata(
    props: {
        params: Promise<{lang: string, playlist_id: number }>;
    }
): Promise<Metadata> {
    const params = await props.params;
    const t = await getTranslations({ locale: params.lang as SupportedLocale });
    const playlist = await getPlaylist(params.playlist_id);
    if (!playlist) return { title: upperFirst(t('common.messages.playlist_not_found')) }
    return {
		title: t('pages.playlist.metadata.title', { title: playlist.title, username: playlist.user?.username! }),
		description: truncate(t('pages.playlist.metadata.description', { username: playlist.user?.username!, app: siteConfig.name }), { length: siteConfig.seo.description.limit }),
        alternates: generateAlternates(params.lang, `/playlist/${playlist.id}`),
        openGraph: {
            siteName: siteConfig.name,
            title: `${t('pages.playlist.metadata.title', { title: playlist.title, username: playlist.user?.username! })} • ${siteConfig.name}`,
            description: truncate(t('pages.playlist.metadata.description', { username: playlist.user?.username!, app: siteConfig.name }), { length: siteConfig.seo.description.limit }),
            url: `${siteConfig.url}/${params.lang}/playlist/${playlist.id}`,
            images: playlist.poster_url ? [
                { url: playlist.poster_url },
            ] : undefined,
            type: 'video.other',
            locale: params.lang,
        },
	};
}

export default async function PlaylistPage(
    props: {
        params: Promise<{lang: string, playlist_id: number }>;
    }
) {
    const params = await props.params;
    const playlist = await getPlaylist(params.playlist_id);
    if (!playlist) return notFound();
    return <Playlist playlist={playlist} />;
};


import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { truncate, upperFirst } from 'lodash';
import { siteConfig } from '@/config/site';
import { Metadata } from 'next';
import { generateAlternates } from '@/lib/i18n/routing';
import { Playlist } from './_components/Playlist';
import { SupportedLocale } from '@libs/i18n';
import { getPlaylist } from '@/api/server/playlists';

export async function generateMetadata(
    props: {
        params: Promise<{lang: SupportedLocale, playlist_id: number }>;
}
): Promise<Metadata> {
    const { lang, playlist_id} = await props.params;
    const t = await getTranslations({ locale: lang });
    if (isNaN(playlist_id)) {
        return { title: upperFirst(t('common.messages.playlist_not_found')) };
    }
    const { data: playlist, error } = await getPlaylist(playlist_id);
    if (error || !playlist) {
        return { title: upperFirst(t('common.messages.playlist_not_found')) };
    }
    return {
		title: t('pages.playlist.metadata.title', { title: playlist.title, username: playlist.owner.username }),
		description: truncate(t('pages.playlist.metadata.description', { username: playlist.owner.username, app: siteConfig.name }), { length: siteConfig.seo.description.limit }),
        alternates: generateAlternates(lang, `/playlist/${playlist.id}`),
        openGraph: {
            siteName: siteConfig.name,
            title: `${t('pages.playlist.metadata.title', { title: playlist.title, username: playlist.owner.username })} • ${siteConfig.name}`,
            description: truncate(t('pages.playlist.metadata.description', { username: playlist.owner.username, app: siteConfig.name }), { length: siteConfig.seo.description.limit }),
            url: `${siteConfig.url}/${lang}/playlist/${playlist.id}`,
            images: playlist.poster ? [
                { url: playlist.poster },
            ] : undefined,
            type: 'video.other',
            locale: lang,
        },
	};
}

export default async function PlaylistPage(
    props: {
        params: Promise<{lang: SupportedLocale, playlist_id: number }>;
    }
) {
    const { playlist_id } = await props.params;
    if (isNaN(playlist_id)) {
        return notFound();
    }
    const { data: playlist, error } = await getPlaylist(playlist_id);
    if (error || !playlist) return notFound();
    return <Playlist playlist={playlist} />;
};


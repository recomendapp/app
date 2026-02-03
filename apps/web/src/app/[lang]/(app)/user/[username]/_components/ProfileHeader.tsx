import { UserAvatar } from '@/components/User/UserAvatar';
import { Button } from '@/components/ui/button';
import { LinkIcon, Settings } from 'lucide-react';
import { Link } from "@/lib/i18n/navigation";
import { HeaderBox } from '@/components/Box/HeaderBox';
import { Database } from '@recomendapp/types';
import { ProfileFollowersButton } from './ProfileFollowersButton';
import { ProfileFolloweesButton } from './ProfileFolloweesButton';
import { Icons } from '@/config/icons';
import { ButtonGroup } from '@/components/ui/button-group';
import { Session } from '@supabase/supabase-js';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileFollowButton } from './ProfileFollowButton';

export const ProfileHeader = ({
  profile,
  session,
}: {
  profile?: Database['public']['Views']['profile']['Row'] | null;
  session: Session | null;
}) => {
  return (
    <HeaderBox className='h-fit!' background={profile?.background_url ? { src: profile.background_url, alt: profile.username ?? ''} : undefined}>
      <div className='max-w-7xl w-full flex flex-col @lg/header-box:items-start @lg/header-box:flex-row gap-4'>
        <div className="flex gap-4 shrink-0 items-start justify-between w-full @lg/header-box:w-fit">
          {profile ? (
            <UserAvatar
            className=" h-20 w-20 @md:h-28 @md:w-28 xl:h-36 xl:w-36"
            avatarUrl={profile.avatar_url}
            username={profile.username}
            />
          ) : <Skeleton className="h-20 w-20 @md:h-28 @md:w-28 xl:h-36 xl:w-36 rounded-full"/>}
          <div className="flex flex-col gap-2 items-end">
            <ButtonGroup className="@lg/header-box:hidden">
              <ButtonGroup>
                <ProfileFollowersButton userId={profile?.id} disabled={!profile?.visible ? true : false} />
                <ProfileFolloweesButton userId={profile?.id} disabled={!profile?.visible ? true : false} />
              </ButtonGroup>
              {session?.user.id == profile?.id && (
                <ButtonGroup>
                  <Button variant={'outline'} asChild>
                    <Link href={'/settings/profile'}>
                      <Settings />
                    </Link>
                  </Button>
                </ButtonGroup>
              )}
            </ButtonGroup>
            {profile && session?.user.id !== profile?.id && <ProfileFollowButton profileId={profile?.id} className="@lg/header-box:hidden" />}
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full">
          {/* SECTION 1 */}
          <section className="flex items-center justify-between gap-2">
            {profile ? (
              <Link
              href={`/@${profile?.username}`}
              className="flex items-center gap-1"
              >
              
                <h2 className="text-xl font-semibold">
                  {profile?.full_name}
                  {profile?.premium && (
                      <Icons.premium className='ml-1 fill-blue-400 inline w-3'/>
                  )}
                </h2>
                <span className="text-muted-foreground">@{profile?.username}</span>
              </Link>
            ) : <Skeleton className="h-8 w-48 rounded-md"/>}
            <ButtonGroup className="hidden @lg/header-box:flex">
              <ButtonGroup>
                <ProfileFollowersButton userId={profile?.id!} className="hidden sm:block" disabled={!profile?.visible ? true : false} />
                <ProfileFolloweesButton userId={profile?.id!} className="hidden sm:block" disabled={!profile?.visible ? true : false} />
              </ButtonGroup>
              {session?.user.id == profile?.id && (
                <ButtonGroup>
                  <Button variant={'outline'} asChild>
                    <Link href={'/settings/profile'}>
                      <Settings />
                    </Link>
                  </Button>
                </ButtonGroup>
              )}
            </ButtonGroup>
          </section>
          {/* SECTION 2 */}
          {profile && (
            <section className="flex justify-between h-full">
              <div>
                {profile?.bio && (
                  <p className="text-justify max-w-lg">{profile?.bio}</p>
                )}
                {profile?.website && (
                  <Link
                    href={profile?.website}
                    className="flex gap-2 items-center text-accent-pink hover:text-accent-pink-hover"
                    target="_blank"
                  >
                    <LinkIcon width={15} />
                    {profile?.website.replace(/(^\w+:|^)\/\//, '')}
                  </Link>
                )}
              </div>
              <ProfileFollowButton profileId={profile.id} className="hidden @lg/header-box:flex" />
            </section>
          )}
        </div>
      </div>
    </HeaderBox>
  );
}

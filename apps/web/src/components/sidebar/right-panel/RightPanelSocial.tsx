import { CardUser } from "@/components/Card/CardUser";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/User/UserAvatar";
import { Icons } from "@/config/icons";
import { useAuth } from "@/context/auth-context";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { createRightPanel } from "./RightPanelUtils";
import Fuse from "fuse.js";
import { Database, UserFollower } from "@recomendapp/types";
import { Input } from "@/components/ui/input";
import { useUserFolloweesOptions, useUserFollowersRequestsOptions } from "@/api/client/options/userOptions";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useUserAcceptFollowerRequestMutation, useUserDeclineFollowerRequestMutation } from "@/api/client/mutations/userMutations";

export const RightPanelSocial = () => createRightPanel({
	title: 'Social',
	component: RightPanelSocialContent,
	props: {},
	onlyAuth: true,
})

const RightPanelSocialContent = () => {
	return (
		<Tabs defaultValue="follows" className='p-2'>
			<TabsList className="grid grid-cols-2 max-w-[400px]">
			<TabsTrigger value="follows">Suivis</TabsTrigger>
			<TabsTrigger value="requests">Demandes</TabsTrigger>
			</TabsList>
			<TabsContent value="follows" className="grid gap-2">
				<RightPanelSocialFollows />
			</TabsContent>
			<TabsContent value="requests">
				<RightPanelSocialRequests />
			</TabsContent>
		</Tabs>
	);
}

const RightPanelSocialFollows = () => {
	const { session } = useAuth();
	const [search, setSearch] = useState('');
	// const [results, setResults] = useState<{ id: number, followee: Database['public']['Views']['profile']['Row'] }[] | undefined>(undefined);
	const {
		data: followees,
		isLoading,
		isError,
	} = useInfiniteQuery(useUserFolloweesOptions({
		userId: session?.user.id,
	}));
	const fuse = useMemo(() => {
		if (!followees?.pages.length) return null;
		return new Fuse(followees.pages.flat(), {
			keys: ['followee.username', 'followee.full_name'],
			threshold: 0.3,
		});
	}, [followees]);
	const results = useMemo(() => {
		if (!followees?.pages) return [];
		const items = followees.pages.flat();

		if (search === '') return items;
		if (!fuse) return [];

		return fuse.search(search).map(({ item }) => item);
	}, [followees, search, fuse]);

	if (isLoading) {
		return <Icons.loader className='w-8 h-8 mx-auto' />
	}

	return (
		<>
			<Input placeholder="Rechercher" value={search} onChange={(e) => setSearch(e.target.value)} />
			{results?.length ?
				results.map(({ followee }, i) => (
					<CardUser key={i} user={followee} />
				))
			: search ? (
				<div></div>
			) : (
				<div className='text-center text-muted-foreground'>Aucun suivi</div>
			)}
		</>
	)
}

const RightPanelSocialRequests = () => {
	const { session } = useAuth();
	const {
		data: requests,
		isLoading,
		isError,
	} = useInfiniteQuery(useUserFollowersRequestsOptions({
		userId: session?.user.id,
	}));

	const { mutateAsync: acceptRequest } = useUserAcceptFollowerRequestMutation();
	const { mutateAsync: declineRequest } = useUserDeclineFollowerRequestMutation();

	const handleAcceptRequest = useCallback(async(requestId: number) => {
		await acceptRequest({
			requestId,
		}, {
			onSuccess: () => {
				toast.success('Demande acceptée');
			},
			onError: () => {
				toast.error("Une erreur s'est produite");
			}
		});
	}, [acceptRequest]);

	const handleDeclineRequest = useCallback(async(requestId: number) => {
		await declineRequest({
			requestId,
		}, {
			onSuccess: () => {
				toast.success('Demande refusée');
			},
			onError: () => {
				toast.error("Une erreur s'est produite");
			}
		});
	}, [declineRequest]);

	return (
		<>
			{requests?.pages.length ? (
				<>
					{requests?.pages.flat().map(({ id, user }, i) => (
						<Card
						key={i}
						className={"flex flex-col rounded-xl bg-muted hover:bg-muted-hover p-1"}
						>
							<div className="flex items-center p-1">
								<UserAvatar username={user.username} avatarUrl={user.avatar_url} />
								<div className='px-2 py-1 space-y-1'>
									<p className='line-clamp-2 wrap-break-word'>{user.username}</p>
									<p className="text-muted-foreground">@{user.username}</p>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<Button onClick={() => handleAcceptRequest(id)}>Accepter</Button>
								<Button variant="outline" onClick={() => handleDeclineRequest(id)}>Refuser</Button>
							</div>
						</Card>
					))}
				</>
			) : (isLoading || requests === undefined) ? (
				<Icons.loader className='w-8 h-8 mx-auto' />
			) : isError ? (
				<div className='text-center text-muted-foreground'>Une erreur s&apos;est produite</div>
			) : (
				<div className='text-center text-muted-foreground'>Aucune demande</div>
			)}
		</>
	);



}
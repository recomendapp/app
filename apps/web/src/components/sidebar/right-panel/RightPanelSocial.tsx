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
import { Input } from "@/components/ui/input";
import { useInfiniteQuery } from "@tanstack/react-query";
import { userFollowingInfiniteOptions, userFollowRequestsInfiniteOptions, useUserAcceptFollowMutation, useUserDeclineFollowMutation } from "@libs/query-client";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";
import { useInView } from "react-intersection-observer";

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
	const { user } = useAuth();
	const t = useTranslations();
	const { ref, inView } = useInView();
	const [search, setSearch] = useState('');
	const {
		data: followees,
		isLoading,
		isFetching,
		fetchNextPage,
		hasNextPage,
	} = useInfiniteQuery(userFollowingInfiniteOptions({
		profileId: user?.id,
	}));
	const fuse = useMemo(() => {
		if (!followees?.pages.length) return null;
		return new Fuse(followees.pages.flatMap(page => page.data), {
			keys: ['username', 'name'],
			threshold: 0.3,
		});
	}, [followees]);
	const results = useMemo(() => {
		if (!followees?.pages) return [];
		const items = followees.pages.flatMap(page => page.data);

		if (search === '') return items;
		if (!fuse) return [];

		return fuse.search(search).map(({ item }) => item);
	}, [followees, search, fuse]);

	useEffect(() => {
		if (inView && hasNextPage) fetchNextPage();
	}, [inView, hasNextPage, fetchNextPage]);

	if (isLoading) {
		return <Icons.loader className='w-8 h-8 mx-auto' />
	}

	return (
		<>
			<Input placeholder="Rechercher" value={search} onChange={(e) => setSearch(e.target.value)} />
			{results?.length ? (
			<>
				{results.map((user, i) => (
					<CardUser key={i} user={user} className="h-14"/>
				))}
				{isFetching ? (
					<div className="flex items-center justify-center">
						<Icons.loader />
					</div>
				) : (
					<div ref={ref} />
				)}
			</>
			)
			: search ? (
				<div></div>
			) : (
				<div className='text-center text-muted-foreground'>{upperFirst(t('common.messages.no_results'))}</div>
			)}
		</>
	)
}

const RightPanelSocialRequests = () => {
	const { user } = useAuth();
	const t = useTranslations();
	const { ref, inView } = useInView();
	const {
		data: requests,
		isLoading,
		isError,
		isFetching,
		fetchNextPage,
		hasNextPage,
	} = useInfiniteQuery(userFollowRequestsInfiniteOptions({
		userId: user?.id,
	}));
	const flattenedRequests = useMemo(() => requests?.pages.flatMap(page => page.data) || [], [requests]);

	const { mutateAsync: acceptRequest } = useUserAcceptFollowMutation();
	const { mutateAsync: declineRequest } = useUserDeclineFollowMutation();

	const handleAcceptRequest = useCallback(async(targetUserId: string) => {
		await acceptRequest({
			path: {
				user_id: targetUserId,
			},
		}, {
			onSuccess: () => {
				toast.success(upperFirst(t('common.messages.request_accepted', { count: 1 })));
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [acceptRequest, t]);

	const handleDeclineRequest = useCallback(async(targetUserId: string) => {
		await declineRequest({
			path: {
				user_id: targetUserId,
			},
		}, {
			onSuccess: () => {
				toast.success(upperFirst(t('common.messages.request_declined', { count: 1 })));
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [declineRequest]);

	useEffect(() => {
		if (inView && hasNextPage) fetchNextPage();
	}, [inView, hasNextPage, fetchNextPage]);

	return (
		<>
			{flattenedRequests.length ? (
				<>
					{flattenedRequests.map(({ createdAt, user }, i) => (
						<Card
						key={i}
						className={"flex flex-col rounded-xl bg-muted hover:bg-muted-hover p-1"}
						>
							<div className="flex items-center p-1">
								<UserAvatar username={user.username} avatarUrl={user.avatar} />
								<div className='px-2 py-1 space-y-1'>
									<p className='line-clamp-2 wrap-break-word'>{user.username}</p>
									<p className="text-muted-foreground">@{user.username}</p>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<Button onClick={() => handleAcceptRequest(user.id)}>{upperFirst(t('common.messages.accept'))}</Button>
								<Button variant="outline" onClick={() => handleDeclineRequest(user.id)}>{upperFirst(t('common.messages.decline'))}</Button>
							</div>
						</Card>
					))}
					{isFetching ? (
						<div className="flex items-center justify-center">
							<Icons.loader />
						</div>
					) : (
						<div ref={ref} />
					)}
				</>
			) : (isLoading || requests === undefined) ? (
				<Icons.loader className='w-8 h-8 mx-auto' />
			) : isError ? (
				<div className='text-center text-muted-foreground'>{upperFirst(t('common.messages.an_error_occurred'))}</div>
			) : (
				<div className='text-center text-muted-foreground'>{upperFirst(t('common.messages.no_results'))}</div>
			)}
		</>
	);



}
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { useEffect, useMemo, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { CardUser } from "../Card/CardUser"
import { useTranslations } from "next-intl"
import { upperFirst } from "lodash"
import { useInfiniteQuery } from "@tanstack/react-query"
import { ButtonGroup } from "../ui/button-group"
import { TooltipBox } from "../Box/TooltipBox"
import { Icons } from "@/config/icons"
import { usersInfiniteOptions } from "@libs/query-client/src"
import { useInView } from "react-intersection-observer"

export const WidgetUserDiscovery = ({
	className,
} : React.HTMLAttributes<HTMLDivElement>) => {
	const t = useTranslations();
	const { ref, inView } = useInView();
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [sortBy, setSortBy] = useState<'created_at' | 'followers_count'>('created_at');
	const {
		data: users,
		fetchNextPage,
		hasNextPage,
		isFetching,
	} = useInfiniteQuery(usersInfiniteOptions({
		filters: {
			sort_by: sortBy,
			sort_order: sortOrder,
		}
	}));
	const flattenUsers = users?.pages.flatMap(page => page.data) || [];
	const totalCount = users?.pages[0].meta.total_results;

	const orderOptions = useMemo((): { value: 'created_at' | 'followers_count', label: string }[] => ([
		{ value: 'created_at', label: upperFirst(t('common.messages.date_created')) },
		{ value: 'followers_count', label: upperFirst(t('common.messages.popularity')) },
	]), [t]);

	useEffect(() => {
		if (inView && hasNextPage) fetchNextPage();
	}, [inView, hasNextPage, fetchNextPage]);

	if (!flattenUsers.length) return null;
	return (
	<div className={cn('flex flex-col gap-4 overflow-hidden', className)}>
		<div className="flex items-center justify-between">
			<Button variant={'link'} className="p-0 w-fit font-semibold text-xl">
				{upperFirst(t('common.messages.discover_users'))}
				{totalCount !== undefined && (
					<span className="text-muted-foreground">- {totalCount}</span>
				)}
			</Button>
			<ButtonGroup>
				<TooltipBox tooltip={upperFirst(sortOrder === 'asc' ? t('common.messages.order_asc') : t('common.messages.order_desc'))}>
					<Button variant={'outline'} onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
						{sortOrder === 'desc' ? <Icons.orderDesc /> : <Icons.orderAsc />}
					</Button>
				</TooltipBox>
				<Select onValueChange={(value) => setSortBy(value as 'created_at' | 'followers_count')} value={sortBy}>
					<SelectTrigger className="w-fit">
						<SelectValue />
					</SelectTrigger>
					<SelectContent align="end">
						{orderOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
						))}
					</SelectContent>
				</Select>
			</ButtonGroup>

		</div>
		<ScrollArea className='h-96 gap-2'>
			<div className="grid gap-2 h-full">
				{flattenUsers.map((user, index) => (
					<CardUser key={index} user={user} />
				))}
				{isFetching ? (
					<Icons.loader className="mx-auto" />
				) : (
					<div ref={ref} />
				)}
			</div>
		</ScrollArea>	
	</div>
	)
}
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { Fragment, useMemo, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { CardUser } from "../Card/CardUser"
import { useTranslations } from "next-intl"
import { upperFirst } from "lodash"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useWidgetUserDiscoveryOptions } from "@/api/client/options/widgetOptions"
import { ButtonGroup } from "../ui/button-group"
import { TooltipBox } from "../Box/TooltipBox"
import { Icons } from "@/config/icons"

export const WidgetUserDiscovery = ({
	className,
} : React.HTMLAttributes<HTMLDivElement>) => {
	const t = useTranslations();
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [sortBy, setSortBy] = useState<'created_at' | 'followers_count'>('created_at');
	const {
		data: users,
		isLoading,
		fetchNextPage,
		isFetchingNextPage,
		hasNextPage,
	} = useInfiniteQuery(useWidgetUserDiscoveryOptions({
		filters: {
			sortBy: sortBy,
			sortOrder: sortOrder,
		}
	}));

	const orderOptions = useMemo((): { value: 'created_at' | 'followers_count', label: string }[] => ([
		{ value: 'created_at', label: upperFirst(t('common.messages.date_created')) },
		{ value: 'followers_count', label: upperFirst(t('common.messages.popularity')) },
	]), [t]);

	if (!users || !users.pages[0].length) return null;
	return (
	<div className={cn('flex flex-col gap-4 overflow-hidden', className)}>
		<div className="flex items-center justify-between">
			<Button variant={'link'} className="p-0 w-fit font-semibold text-xl">
				{upperFirst(t('common.messages.discover_users'))}
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
		<ScrollArea className='h-full gap-2'>
			<div className="grid gap-2 h-full">
				{users.pages.map((page, index) => (
				<Fragment key={index}>
					{page.map((user, index) => (
					<CardUser key={index} user={user} />
					))}
				</Fragment>
				))}
				{hasNextPage ? <Button variant={'outline'} onClick={() => fetchNextPage()} disabled={isLoading || isFetchingNextPage}>
					Afficher plus
				</Button> : null}
			</div>
		</ScrollArea>	
	</div>
	)
}
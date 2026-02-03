'use client'

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "@/lib/i18n/navigation";
import { upperFirst } from "lodash";
import { LayoutGridIcon, ListIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label";
import { Icons } from "@/config/icons";
import { DISPLAY, SORT_BY } from "./constants";
import { Database } from "@recomendapp/types";
import { ButtonGroup } from "@/components/ui/button-group";
import { useCallback, useMemo } from "react";
import { TooltipBox } from "@/components/Box/TooltipBox";


export const Filters = ({
	knownForDepartment,
	jobs,
	sortBy,
	sortOrder,
	display,
	department,
	job,
} : {
	knownForDepartment: String;
	jobs: Database['public']['Views']['media_person_jobs']['Row'][];
	sortBy: typeof SORT_BY[number];
	sortOrder: 'asc' | 'desc';
	display: typeof DISPLAY[number];
	department?: string;
	job?: string;
}) => {
	const t = useTranslations();
	const searchParams = useSearchParams();
	const router = useRouter();
	const hasActiveFilters = useMemo(() => {
		return !!department || !!job;
	}, [department, job]);

	const handleChange = useCallback((entries: { [key: string]: string | null }) => {
		const params = new URLSearchParams(searchParams.toString());
		for (const [name, value] of Object.entries(entries)) {
			if (!value) {
				params.delete(name);
			} else {
				params.set(name, value);
			}
		}
		router.push(`?${params.toString()}`);
	}, [searchParams, router]);
	return (
	<ButtonGroup>
		<ButtonGroup>
			<Popover>
				<PopoverTrigger asChild>
					<Button variant={'outline'} className="relative">
						{hasActiveFilters && (
							<span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent-yellow"></span>
						)}
						<Icons.filter />
						<span>{upperFirst(t('common.messages.filter', { count: 2 }))}</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-80 space-y-2">
					<div className="grid grid-cols-3 items-center gap-4">
						<Label htmlFor="width">{upperFirst(t('common.messages.department', { count: 1 }))}</Label>
						<Select
						value={department ?? ''}
						onValueChange={(e) => {
							handleChange({ department: e ?? null, job: null });
						}}
						>
							<SelectTrigger className="col-span-2">
								<SelectValue placeholder="Select a department" />
							</SelectTrigger>
							<SelectContent>
								{jobs.map((department, i) => {
									if (!department.department) return null;
									return (
										<SelectItem key={i} value={department.department}>
											{department.department}
											{department.department === knownForDepartment && (
												<Icons.star size={14} className="inline text-accent-yellow fill-accent-yellow ml-2" />
											)}
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
					</div>
					<div className="grid grid-cols-3 items-center gap-4">
						<Label htmlFor="width">{upperFirst(t('common.messages.job', { count: 1 }))}</Label>
						<Select
						value={job ?? ''}
						onValueChange={(e) => {
							handleChange({ job: e ?? null });
						}}
						disabled={!department || !jobs.some(d => d.department === department)}
						>
							<SelectTrigger className="col-span-2">
								<SelectValue placeholder="Select a job"/>
							</SelectTrigger>
							<SelectContent>
								{jobs.filter(d => d.department === department).map((department, i) => (
									department.jobs?.map((job, j) => (
										<SelectItem key={j} value={job}>
											{job}
										</SelectItem>
									))
								))}
							</SelectContent>
						</Select>
					</div>
				</PopoverContent>
			</Popover>
		</ButtonGroup>
		<ButtonGroup>
			<TooltipBox tooltip={upperFirst(sortOrder === 'asc' ? t('common.messages.order_asc') : t('common.messages.order_desc'))}>
				<Button variant={'outline'} onClick={() => handleChange({ sort_order: sortOrder === 'asc' ? 'desc' : 'asc' })}>
					{sortOrder === 'desc' ? <Icons.orderDesc /> : <Icons.orderAsc />}
				</Button>
			</TooltipBox>
			<Select defaultValue={sortBy} onValueChange={(e) => handleChange({ sort_by: e })}>
				<SelectTrigger className="col-span-2">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{SORT_BY.map((item, i) => (
						<SelectItem key={i} value={item}>
							{upperFirst(t(`common.messages.${item}`))}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</ButtonGroup>
		<ButtonGroup>
			<Button variant={'outline'} onClick={(e) => {
				e.preventDefault();
				handleChange({ display: display === 'grid' ? 'row' : 'grid' });
			}}>
				{display === 'grid' ? <LayoutGridIcon /> : <ListIcon />}
				<span>{display === 'grid' ? upperFirst(t('common.messages.grid', { count: 1 })) : upperFirst(t('common.messages.list', { count: 1 }))}</span>
			</Button>
		</ButtonGroup>
	</ButtonGroup>
	)
}
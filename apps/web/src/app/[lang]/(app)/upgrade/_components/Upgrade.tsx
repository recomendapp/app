"use client"

import { HeaderBox } from "@/components/Box/HeaderBox";
import { ModalSubscription } from "@/components/Modals/Subscription/ModalSubscription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/components/ui/format-price";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Icons } from "@/config/icons";
import { Images } from "@/config/images";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/context/auth-context";
import { useModal } from "@/context/modal-context";
import { calculateSave } from "@/utils/calculate-save";
import { title } from "@/utils/custom-lodash";
import { useRandomImage } from "@/hooks/use-random-image";
import { cn } from "@/lib/utils";
import { upperFirst } from "lodash";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { Fragment, useCallback, useMemo, useState } from "react";
import { useOffering } from "@/lib/revenuecat";
import { Skeleton } from "@/components/ui/skeleton";
import { Offering, Package } from "@revenuecat/purchases-js";
import toast from "react-hot-toast";

interface PlanFeature {
	type: string;
	features: {
	  name: string;
	  description?: string;
	  free: boolean | string;
	  premium: boolean | string;
	  soon?: boolean;
	  className?: string;
	}[];
}

const GetStarted = ({
	offering,
	onPurchase,
} : {
	offering?: Offering | null;
	onPurchase?: () => void | Promise<void>;
}) => {
	const { session, customerInfo } = useAuth();
	const t = useTranslations();
	if (!session) {
		return (
			<Button className='w-full' asChild>
				<Link href={`/auth/login?redirect=${encodeURIComponent('/upgrade')}`}>
				{upperFirst(t('common.messages.get_started'))}
				</Link>
			</Button>
		)
	}
	if (!offering) {
		return (
			<Button className='w-full' disabled>
				<Icons.spinner />
			</Button>
		)
	} else {
		if (customerInfo?.entitlements.active['premium']) {
			return (
				<Button className='w-full' asChild>
					<Link href={`/settings/subscription`}>
					{upperFirst(t('common.messages.manage'))}
					</Link>
				</Button>
			)
		} else {
			return (
				<Button className='w-full' onClick={onPurchase}>
				{upperFirst(t('common.messages.upgrade_to_plan', {
					plan: offering.serverDescription,
				}))}
				</Button>
			)
		}
	}
};

export const Upgrade = () => {
	const { session, customerInfo } = useAuth();
	const {
		isLoading: isOfferingLoading,
		offering,
		purchasePackage,
	} = useOffering();
	const pathname = usePathname();
	const router = useRouter();
	const locale = useLocale();
	const { openModal } = useModal();
	const t = useTranslations();
	const bgImage = useRandomImage(Images.upgrade.background);
	const [billingInterval, setBillingInterval] = useState<'annual' | 'monthly'>('monthly');

	const planFeatures = useMemo((): PlanFeature[] => [
		{
			type: upperFirst(t('pages.upgrade.subscription.features.activities.label')),
			features: [
				{
					name: upperFirst(t('pages.upgrade.subscription.features.activities.unlimited_activities.label')),
					description: upperFirst(t('pages.upgrade.subscription.features.activities.unlimited_activities.description')),
					free: true,
					premium: true,
				},
				{
					name: upperFirst(t('pages.upgrade.subscription.features.activities.favorites.label')),
					description: upperFirst(t('pages.upgrade.subscription.features.activities.favorites.description')),
					free: true,
					premium: true,
					soon: true,
				}
			],
		},
		{
			type: upperFirst(t('pages.upgrade.subscription.features.playlists.label')),
			features: [
				{
					name: upperFirst(t('pages.upgrade.subscription.features.playlists.unlimited_playlists.label')),
					description: upperFirst(t('pages.upgrade.subscription.features.playlists.unlimited_playlists.description')),
					free: true,
					premium: true,
				},
				{
					name: upperFirst(t('pages.upgrade.subscription.features.playlists.shared_playlists.label')),
					description: upperFirst(t('pages.upgrade.subscription.features.playlists.shared_playlists.description')),
					free: true,
					premium: true,
				},
				{
					name: upperFirst(t('pages.upgrade.subscription.features.playlists.collaborative_playlists.label')),
					description: upperFirst(t('pages.upgrade.subscription.features.playlists.collaborative_playlists.description')),
					free: false,
					premium: true,
				}
			]
		},
		{
			type: upperFirst(t('pages.upgrade.subscription.features.feed.label')),
			features: [
				{
					name: upperFirst(t('pages.upgrade.subscription.features.feed.followees.label')),
					description: upperFirst(t('pages.upgrade.subscription.features.feed.followees.description')),
					free: true,
					premium: true,
				},
				{
					name: title(t('pages.upgrade.subscription.features.feed.cast_and_crew.label')),
					description: upperFirst(t('pages.upgrade.subscription.features.feed.cast_and_crew.description')),
					free: false,
					premium: true,

				}
			]
		},
		{
			type: upperFirst(t('pages.upgrade.subscription.features.support.label')),
			features: [
				{
					name: upperFirst(t('pages.upgrade.subscription.features.support.team.label', {
						app: siteConfig.name,
					})),
					free: "+",
					premium: "+++",
				},
				{
					name: upperFirst(t('pages.upgrade.subscription.features.support.credits.label')),
					description: upperFirst(t('pages.upgrade.subscription.features.support.credits.description')),
					free: false,
					premium: true,
					soon: true,
				}
			]
		},
		...(offering ? ([
			{
				type: upperFirst(t('common.messages.price')),
				features: [
					{
						name: '',
						free: formatPrice(
							{
								unit_amount: 0,
								currency: offering?.monthly?.webBillingProduct.price.currency,
							},
							locale
						),
						premium: formatPrice(
							{
								unit_amount: billingInterval === 'annual' ? offering?.annual?.webBillingProduct.price.amountMicros! / 10_000 : offering?.monthly?.webBillingProduct.price.amountMicros! / 10_000,
								currency: offering?.monthly?.webBillingProduct.price.currency,
							},
							locale
						),
						className: 'text-3xl font-bold',
					}
				]
			}
		]) : [])
	], [t, billingInterval, offering, locale]);

	const handlePurchase = useCallback(async (plan: Package) => {
		if (!session) {
			toast.error(upperFirst(t('common.messages.not_logged_in')));
		  	return router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
		}
		if (customerInfo?.entitlements.active[plan.identifier]) {
		  	return router.push('/settings/subscription');
		}
		await purchasePackage(plan);
	}, [purchasePackage, session, customerInfo, router, pathname, t]);

	const handleSelectPlan = useCallback(() => {
		if (!offering) return;
		openModal(
			ModalSubscription, {
				offering: offering,
				preselectedPlan: (billingInterval === 'annual' ? offering.annual : offering.monthly) || undefined,
				onPurchase: handlePurchase,
			}
		);
	}, [openModal, offering, billingInterval, handlePurchase]);

	return (
		<>
		<HeaderBox className="@xl/header-box:h-fit" background={bgImage ? { src: bgImage?.src, alt: bgImage?.alt ?? '', unoptimized: true } : undefined}>
			<div className='container flex flex-col w-full gap-4 justify-center max-w-xl mx-0 my-10'>
				<h1 className='text-3xl @sm/header-box:text-4xl @lg/header-box:text-5xl font-bold text-white'>
				{upperFirst(t('pages.upgrade.header.title', { app: siteConfig.name }))}
				</h1>
				{!isOfferingLoading ? (
					offering && (
					<h2>
					{upperFirst(t('pages.upgrade.header.subtitle', { price: `${formatPrice({ unit_amount: offering?.monthly?.webBillingProduct.price.amountMicros! / 10_000, currency: offering?.monthly?.webBillingProduct.price.currency }, locale)}` }))}
					</h2>
					)
				) : <Skeleton className="h-6 w-3/4" />}
				<div className='flex gap-4 max-w-xs'>
					<GetStarted offering={offering} onPurchase={handleSelectPlan} />
					<Button variant={'outline'} className='w-full' asChild>
						<Link href='#features'>
						{upperFirst(t('common.messages.compare_plans'))}
						</Link>
					</Button>
				</div>
			</div>
		</HeaderBox>
		{!isOfferingLoading ? (
			<Table id="features" className="max-w-xl mx-auto mt-10 mb-10">
				<TableHeader>
				<TableRow className="">
					<TableHead className="text-foreground flex items-center">
						{offering && (
							<>
							<Label htmlFor="payment-schedule" className="me-3">
							{upperFirst(t('common.messages.monthly'))}
							</Label>
							<Switch id="payment-schedule" checked={billingInterval === 'annual'} onCheckedChange={() => setBillingInterval(billingInterval === 'annual' ? 'monthly' : 'annual')} />
							<Label htmlFor="payment-schedule" className="relative ms-3">
								{upperFirst(t('common.messages.yearly'))}
								{offering && (
									<span className="absolute -top-10 start-auto -end-28">
										<span className="flex items-center">
											<svg
											className="w-14 h-8 -me-6"
											width={45}
											height={25}
											viewBox="0 0 45 25"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
											>
											<path
												d="M43.2951 3.47877C43.8357 3.59191 44.3656 3.24541 44.4788 2.70484C44.5919 2.16427 44.2454 1.63433 43.7049 1.52119L43.2951 3.47877ZM4.63031 24.4936C4.90293 24.9739 5.51329 25.1423 5.99361 24.8697L13.8208 20.4272C14.3011 20.1546 14.4695 19.5443 14.1969 19.0639C13.9242 18.5836 13.3139 18.4152 12.8336 18.6879L5.87608 22.6367L1.92723 15.6792C1.65462 15.1989 1.04426 15.0305 0.563943 15.3031C0.0836291 15.5757 -0.0847477 16.1861 0.187863 16.6664L4.63031 24.4936ZM43.7049 1.52119C32.7389 -0.77401 23.9595 0.99522 17.3905 5.28788C10.8356 9.57127 6.58742 16.2977 4.53601 23.7341L6.46399 24.2659C8.41258 17.2023 12.4144 10.9287 18.4845 6.96211C24.5405 3.00476 32.7611 1.27399 43.2951 3.47877L43.7049 1.52119Z"
												fill="currentColor"
												className="text-muted-foreground"
											/>
											</svg>
											<Badge className="mt-3 uppercase shrink-0">{(t('common.messages.save_up_to_percent', { percent: calculateSave({ unit_amount: offering?.annual?.webBillingProduct.price.amountMicros!, interval: 'yearly' }, { unit_amount: offering?.monthly?.webBillingProduct.price.amountMicros!, interval: 'monthly' }) }))}</Badge>
										</span>
									</span>
								)}
							</Label>
							</>
						)}
					</TableHead>
					<TableHead className="w-2/12 text-foreground text-lg font-medium text-center">
					{upperFirst(t('common.messages.free'))}
					</TableHead>
					<TableHead className="w-2/12 text-foreground text-lg font-medium text-center">
					{upperFirst(offering?.serverDescription ?? 'Premium')}
					</TableHead>
				</TableRow>
				</TableHeader>
				<TableBody>
					{planFeatures.map((featureType, index) => (
					<Fragment key={index}>
						<TableRow className="bg-muted/50" key={featureType.type}>
						<TableCell colSpan={5} className="font-bold">
							{featureType.type}
						</TableCell>
						</TableRow>
						{featureType.features.map((feature, i) => (
						<TableRow key={i}>
							<TableCell>
								{feature.name} {feature.soon && <span className="text-xs text-accent-yellow">{`(${t('common.messages.soon')})`}</span>}
								{feature.description && (
									<p className="text-muted-foreground text-sm">
										{feature.description}
									</p>
								)}
							</TableCell>
							<TableCell>
							<div className={cn("mx-auto w-min", feature.className)}>
								{typeof feature.free === 'string' ? feature.free : feature.free ? <Icons.check className="h-5 w-5" /> : <Icons.minus className="h-2 w-2" />}
							</div>
							</TableCell>
							<TableCell>
							<div className={cn("mx-auto w-min", feature.className)}>
								{typeof feature.premium === 'string' ? feature.premium : feature.premium ? <Icons.check className="h-5 w-5" /> : <Icons.minus className="h-2 w-2" />}
							</div>
							</TableCell>
						</TableRow>
						))}
					</Fragment>
					))}
					<TableRow>
						<TableCell colSpan={2}></TableCell>
						<TableCell>
							<GetStarted offering={offering} onPurchase={handleSelectPlan} />
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		) : (
			<Skeleton className="h-full w-full max-w-xl mx-auto mt-10 mb-10" />
		)}
		</>
	);
};
'use client';

import { useModal } from '@/context/modal-context';
import { Modal, ModalBody, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalType } from '../Modal';
import { Card } from '@/components/ui/card';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icons } from '@/config/icons';
import { formatPrice } from '@/components/ui/format-price';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { upperFirst } from 'lodash';
import { Badge } from '@/components/ui/badge';
import { calculateSave } from '@/utils/calculate-save';
import { Offering, Package } from '@revenuecat/purchases-js';
import { Spinner } from '@/components/ui/spinner';


interface ModalSubscriptionProps extends ModalType {
	offering: Offering;
	preselectedPlan?: Package;
	onPurchase: (plan: Package) => Promise<void>;
}

export function ModalSubscription({
	offering,
	preselectedPlan,
	onPurchase,
	...props
} : ModalSubscriptionProps) {
	const t = useTranslations();
	const locale = useLocale();
	const { closeModal } = useModal();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [selectedPlan, setSelectedPlan] = useState<Package | undefined>(preselectedPlan || undefined);

	const plans = useMemo((): { plan: Package, interval: 'yearly' | 'monthly' }[] => {
		return [
			...(offering.monthly ? [{ plan: offering.monthly, interval: 'monthly' as const }] : []),
			...(offering.annual ? [{ plan: offering.annual, interval: 'yearly' as const }] : []),
		]
	}, [offering]);

	const purchasePackage = useCallback(async (plan: Package) => {
		setIsLoading(true);
		try {
			await onPurchase(plan);
		} catch (error) {
			toast.error('Purchase failed');
	 	} finally {
			setIsLoading(false);
		}
	}, [onPurchase]);

	useEffect(() => {
		if (preselectedPlan) {
			setSelectedPlan(preselectedPlan);
		}
	}, [preselectedPlan]);

	return (
		<Modal
			open={props.open}
			onOpenChange={(open) => !open && closeModal(props.id)}
			className='outline-hidden'
		>
			<ModalHeader>
				<ModalTitle>{upperFirst(t('common.messages.upgrade_to_plan', {
					plan: offering.serverDescription,
				}))}</ModalTitle>
				<ModalDescription>
				{upperFirst(t('common.messages.choose_subscription_recurrence'))}
				</ModalDescription>
			</ModalHeader>
			<ModalBody className='flex flex-col gap-2'>
				{plans.map(({ plan, interval }, index) => (
					<Card
					key={plan.identifier}
					className={`
						flex-row items-center justify-between p-4 cursor-pointer hover:bg-muted-hover
					`}
					onClick={() => !isLoading && setSelectedPlan(plan)}
					>
						<div
						className={`
							transition-colors
							${selectedPlan?.identifier === plan.identifier ? 'text-foreground' : 'text-muted-foreground'}
						`}
						>
							<span className='text-2xl font-bold'>{formatPrice({ unit_amount: plan.webBillingProduct.price.amountMicros! / 10_000, currency: plan.webBillingProduct.price.currency }, locale)}</span>
							<span className="pl-2 text-base font-medium">/ {t(`common.messages.${interval}`)}</span>
						</div>
						{index > 0 ? (
							<Badge variant='accent-yellow'>
							{upperFirst(t('common.messages.save_up_to_percent', {
								percent: calculateSave(
									{
										unit_amount: plan.webBillingProduct.price.amountMicros! / 10_000,
										interval: interval,
									},
									{
										unit_amount: plans[index - 1].plan.webBillingProduct.price.amountMicros! / 10_000,
										interval: plans[index - 1].interval,
									}
								),
							}))}
							</Badge>
						) : null}
						<Icons.check
						className={`
							text-accent-yellow transition-opacity
							${selectedPlan?.identifier === plan.identifier ? 'opacity-100' : 'opacity-0'}
						`}
						/>
					</Card>
				))}
			</ModalBody>
			<ModalFooter>
				<Button disabled={isLoading} onClick={() => selectedPlan && purchasePackage(selectedPlan)}>
				{isLoading ? <Spinner /> : null}
				{upperFirst(t('common.messages.upgrade_to_plan', {
					plan: offering.serverDescription,
				}))}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

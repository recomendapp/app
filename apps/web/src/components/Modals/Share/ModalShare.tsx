"use client"

import { useModal } from "@/context/modal-context";
import { Modal, ModalBody, ModalHeader, ModalTitle, ModalType } from "../Modal";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/config/site";
import { FacebookIcon, FacebookShareButton, RedditIcon, RedditShareButton, TelegramIcon, TelegramShareButton, TwitterShareButton, WhatsappIcon, WhatsappShareButton, XIcon } from "react-share";
import { MediaType } from "@recomendapp/types";
import { ButtonCopy } from "@/components/utils/ButtonCopy";
import { useLocale, useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { useUI } from "@/context/ui-context";
import { useMemo, useState } from "react";
import { Icons } from "@/config/icons";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { ShareController } from "@/components/ShareController/ShareController";
import { Separator } from "@/components/ui/separator";

interface ModalShareProps<T> extends ModalType {
	title?: string | null;
	type?: 'playlist' | MediaType | null;
	path: string;
	shareController?: ShareController<any>;
}

export const ModalShare = <T,>({ title, type, path, shareController, ...props }: ModalShareProps<T>) => {
	const { closeModal } = useModal();
	const locale = useLocale();
	const { device } = useUI();
	const common = useTranslations('common');
	const url = useMemo(() => (
		`${location.origin}/${locale}${path}`
	), [path, locale]);
	const sharedData: ShareData = useMemo(() => ({
		title: title ?? '',
		url,
	}), [title, url]);

	const canShare = useMemo(() => {
		return navigator.canShare?.(sharedData) || false;
	}, [sharedData]);
	const [fileToShare, setFileToShare] = useState<File | null>(null);
	const sharedControllerData: ShareData = useMemo(() => ({
		files: fileToShare ? [fileToShare] : [],
	}), [fileToShare]);
	const canShareController = useMemo(() => {
		if (!shareController) return false;
		return navigator.canShare?.(sharedControllerData) ?? false;
	}, [shareController, sharedControllerData]);

	const onShare = async (data: ShareData) => {
		try {
			await navigator.share(data);
		} catch (err) {
			if (err instanceof Object) {
				if ('code' in err && typeof err.code === 'number') {
					if (
						[
							11, // An earlier share has not yet completed
							20, // User cancelled the share action
						].includes(err.code)
					) return null;
				}
				console.error(err);
			}
			toast.error(upperFirst(common('messages.an_error_occurred')));
		}
	};

	return (
		<Modal open={props.open} onOpenChange={(open) => !open && closeModal(props.id)}>
			<ModalHeader>
				<ModalTitle className="line-clamp-2">
					{common.rich('messages.share_title', {
						title: title ?? '',
						strong: (chunks) => <strong>{chunks}</strong>,
					})}
				</ModalTitle>
			</ModalHeader>
			<ModalBody className="space-y-2">
				<div className="flex flex-col items-center gap-2">
					{(shareController && shareController?.Component) && (
						<shareController.Component {...shareController.props} onFileReady={setFileToShare} />
					)}
					{canShareController && (
						<>
							<Button
							disabled={!canShareController}
							onClick={() => onShare(sharedControllerData)}
							>
								{upperFirst(common('messages.share'))}
							</Button>
							<Separator />
						</>
					)}
					{fileToShare && (
						<Button
						onClick={() => {
							if (!fileToShare) return;
							const url = URL.createObjectURL(fileToShare);
							const a = document.createElement('a');
							a.href = url;
							a.download = fileToShare.name || 'image-generee.png';
							document.body.appendChild(a);
							a.click();
							document.body.removeChild(a);
							URL.revokeObjectURL(url);
						}}
						>
							{upperFirst(common('messages.download'))}
						</Button>
					)}
				</div>
				<div>
					<h3 className="text-lg font-semibold mb-2">
						{upperFirst(common('messages.via'))}
					</h3>
					<div className="flex gap-2">
						<TwitterShareButton
						url={url}
						via={siteConfig.socials.twitter.username}
						>
							<XIcon size={32} round />
						</TwitterShareButton>
						<FacebookShareButton
						url={url}
						>
							<FacebookIcon size={32} round />
						</FacebookShareButton>
						<WhatsappShareButton
						url={url}
						>
							<WhatsappIcon size={32} round />
						</WhatsappShareButton>
						<TelegramShareButton
						url={url}
						>
							<TelegramIcon size={32} round />
						</TelegramShareButton>
						<RedditShareButton
						url={url}
						>
							<RedditIcon size={32} round />
						</RedditShareButton>
						{canShare === true && (
							<Button onClick={() => onShare(sharedData)} size={'icon'} className="rounded-full">
								<Icons.add className="h-4 w-4" />
							</Button>
						)}
					</div>
				</div>
				<div>
					<h3 className="text-lg font-semibold mb-2">{upperFirst(common('messages.link'))}</h3>
					<div className="flex space-x-2">
						<Input value={url} readOnly />
						<ButtonCopy text={url} />
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
}
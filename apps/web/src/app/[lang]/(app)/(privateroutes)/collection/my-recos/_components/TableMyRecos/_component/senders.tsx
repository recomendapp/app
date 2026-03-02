import { UserAvatar } from "@/components/User/UserAvatar";
import { useModal } from "@/context/modal-context";
import { Row } from "@tanstack/react-table";
import { Text } from "lucide-react";
import { RecoWithMedia } from "./types";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { ModalRecoSenders } from "@/components/Modals/recos/ModalRecoSenders";

export default function Senders({
	row,
} : {
	row: Row<RecoWithMedia>
}) {
	const senderToShow = 2;

	const { openModal } = useModal();

	return (
		<div
		onClick={() => openModal(ModalRecoSenders, { senders: row.original.senders })}
		className="flex w-fit items-center -space-x-2  cursor-pointer "
		>
			<AvatarGroup>
				{row.original.senders?.slice(0, senderToShow).reverse().map((item, i) => (
				<div key={i} className='relative'>
					{item.user?.username ? <UserAvatar avatarUrl={item.user.avatar} username={item.user.username} /> : null}
					{item?.comment ? <Text size={15} className='absolute -top-1 -right-1 rounded-full bg-background text-accent-yellow p-1'/> : null}
				</div>
				))}
				{row.original.senders.length > senderToShow && (
					<AvatarGroupCount>+{row.original.senders.length - senderToShow}</AvatarGroupCount>
				)}
			</AvatarGroup>
		</div>
	)
}
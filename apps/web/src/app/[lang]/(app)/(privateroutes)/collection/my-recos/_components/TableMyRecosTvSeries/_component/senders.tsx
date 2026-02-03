import { ModalRecosSenders } from "@/components/Modals/recos/ModalRecosSenders";
import { UserAvatar } from "@/components/User/UserAvatar";
import { useModal } from "@/context/modal-context";
import { UserRecosTvSeriesAggregated } from "@recomendapp/types";
import { Row } from "@tanstack/react-table";
import { Text } from "lucide-react";

export default function Senders({
	row,
} : {
	row: Row<UserRecosTvSeriesAggregated>;
}) {
	const senderToShow = 2;

	const { openModal } = useModal();

	return (
		<div
		onClick={() => openModal(ModalRecosSenders, { comments: row.original?.senders })}
		className="flex w-fit items-center -space-x-2  cursor-pointer "
		>
			<div className="flex justify-end flex-row-reverse -space-x-4 space-x-reverse">
				{row.original?.senders?.slice(0, senderToShow).reverse().map((item, i) => (
				<div key={i} className='relative'>
					{item.user?.username ? <UserAvatar className=" border-2 border-background" avatarUrl={item.user?.avatar_url} username={item.user?.username} /> : null}
					{item?.comment ? <Text size={15} className='absolute -top-1 -right-1 rounded-full bg-background text-accent-yellow p-1'/> : null}
				</div>
				))}
			</div>
			{row.original?.senders?.length! > senderToShow && (
				<div className="flex items-center justify-center bg-muted rounded-full h-8 w-8 text-sm">
					+{row.original?.senders?.length! - senderToShow}
				</div>
			)}
		</div>
	)
}
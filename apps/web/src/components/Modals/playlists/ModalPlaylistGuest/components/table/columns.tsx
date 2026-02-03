import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { UserAvatar } from "@/components/User/UserAvatar"
import { useAuth } from "@/context/auth-context"
import { usePlaylistGuestUpdateMutation } from "@/api/client/mutations/playlistMutations"
import { PlaylistGuest } from "@recomendapp/types"
import { CaretSortIcon } from "@radix-ui/react-icons"
import { ColumnDef } from "@tanstack/react-table"
import { upperFirst } from "lodash"
import { useTranslations } from "next-intl"
import { useCallback, useState } from "react"
import toast from "react-hot-toast"

export const Columns = (): ColumnDef<PlaylistGuest>[] => {
	const t = useTranslations();
	return [
		{
		id: "select",
		header: ({ table }) => (
			<Checkbox
			checked={
				table.getIsAllPageRowsSelected() ||
				(table.getIsSomePageRowsSelected() && "indeterminate")
			}
			onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
			aria-label={upperFirst(t('common.messages.select_all'))}
			/>
		),
		cell: ({ row }) => (
			<Checkbox
			checked={row.getIsSelected()}
			onCheckedChange={(value) => row.toggleSelected(!!value)}
			aria-label={upperFirst(t('common.messages.select_row'))}
			/>
		),
		enableSorting: false,
		enableHiding: false,
		},
		{
		accessorKey: "user",
		accessorFn: (row) => row?.user?.username,
		header: ({ column }) => {
			return (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				{upperFirst(t('common.messages.user', { count: 1}))}
				<CaretSortIcon className="ml-2 h-4 w-4" />
			</Button>
			)
		},
		cell: ({ row }) => (
			<div className="flex items-center">
				{row.original?.user?.username ? <UserAvatar avatarUrl={row.original?.user?.avatar_url} username={row.original?.user?.username} /> : null}
				<div className="ml-2">
				<p className="text-sm font-medium leading-none line-clamp-1">
					{row.original?.user?.full_name}
				</p>
				<p className="text-sm text-muted-foreground line-clamp-1">
					@{row.original?.user?.username}
				</p>
				</div>
			</div>
		),
		},
		{
			id: "can_edit",
			accessorKey: "Can Edit",
			header: () => <div className="text-right">{upperFirst(t('common.messages.edit'))}</div>,
			cell: ({ row }) => (
				<div className="text-right">
					<EditSwitch id={row.original?.id} playlistId={row.original?.playlist_id} editSate={row.original?.edit} />
				</div>
			),
		},
	];
};

const EditSwitch = ({
	id,
	playlistId,
	editSate,
}: {
	id: number;
	playlistId: number;
	editSate?: boolean;
}) => {
	const t = useTranslations()
	const { customerInfo } = useAuth()
	const { mutateAsync: updatePlaylistGuest } = usePlaylistGuestUpdateMutation({
		playlistId: playlistId
	})
	const [edit, setEdit] = useState(editSate);

	const handleEdit = useCallback(async (value: boolean) => {
		if (!playlistId || !id) return null;
		await updatePlaylistGuest({
			guestId: id,
			edit: value,
		}, {
			onSuccess: () => {
				setEdit(value)
			},
			onError: () => {
				setEdit(!value)
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		})
	}, [id, playlistId, t, updatePlaylistGuest]);
	return (
	<Switch
		checked={edit}
		onCheckedChange={handleEdit}
		disabled={!customerInfo?.entitlements.active['premium'] && !edit}
	/>
	)
}
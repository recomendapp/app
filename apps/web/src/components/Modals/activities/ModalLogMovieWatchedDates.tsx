'use client'

import { ScrollArea } from "@/components/ui/scroll-area";
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalType } from "../Modal";
import { useModal } from "@/context/modal-context";
import { Card } from "@/components/ui/card";
import { upperFirst } from "lodash";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMovieWatchedDateDeleteMutation, useMovieWatchedDateSetMutation, useMovieWatchedDateUpdateMutation, userMovieWatchedDatesInfiniteOptions } from "@libs/query-client";
import { useAuth } from "@/context/auth-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useCallback } from "react";
import { enUS, fr } from "date-fns/locale";
import { Icons } from "@/config/icons";
import { WatchedDate } from "@libs/api-js";
import toast from "react-hot-toast";

interface ModalLogMovieWatchedDatesProps extends ModalType {
	movieId: number;
}

export const ModalLogMovieWatchedDates = ({
	movieId,
	...props
  } : ModalLogMovieWatchedDatesProps) => {
	const t = useTranslations();
	const { user } = useAuth();
	const locale = useLocale();
	const { closeModal } = useModal();
	const formatter = useFormatter();
	const {
		data: wachedDates,
	} = useInfiniteQuery(userMovieWatchedDatesInfiniteOptions({
		userId: user?.id,
		movieId: movieId,
	}));

	const { mutateAsync: setWatchedDate, isPending: isSetPending } = useMovieWatchedDateSetMutation();
	const { mutateAsync: updateWatchedDate, isPending: isUpdatePending } = useMovieWatchedDateUpdateMutation();
	const { mutateAsync: deleteWatchedDate, isPending: isDeletePending } = useMovieWatchedDateDeleteMutation();

	const handleInsertDate = useCallback(async (date: Date) => {
		await setWatchedDate({
			path: {
				movie_id: movieId,
			},
			body: {
				watchedDate: date.toISOString(),
			}
		}, {
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		})
	}, [setWatchedDate, movieId]);

	const handleUpdateDate = useCallback(async (date: WatchedDate) => {
		await updateWatchedDate({
			path: {
				movie_id: movieId,
				watched_date_id: date.id,
			},
			body: {
				watchedDate: date.watchedDate,
			}
		}, {
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		})
	}, [updateWatchedDate, movieId]);

	const handleDeleteDate = useCallback(async (dateId: number) => {
		await deleteWatchedDate({
			path: {
				movie_id: movieId,
				watched_date_id: dateId,
			},
		}, {
			onError: (error: any) => {
				if ('statusCode' in error) {
					switch (error.statusCode) {
						case 400:
							toast.error(upperFirst(t('common.messages.at_least_one_watched_date_required')));
							break;
						default:
							toast.error(upperFirst(t('common.messages.an_error_occurred')));
					}
				} else {
					toast.error(upperFirst(t('common.messages.an_error_occurred')));
				}
			}
		})
	}, [deleteWatchedDate, movieId]);

	return (
		<Modal
			open={props.open}
			onOpenChange={(open) => !open && closeModal(props.id)}
		>
			<ModalHeader>
				<ModalTitle>{upperFirst(t('common.messages.watched_date', { count: 2 }))}</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<ScrollArea>
					<div className="max-h-94 flex flex-col gap-2">
						{wachedDates?.pages.map((page) => (
							page.data.map((date, i) => (
								<Card key={i} className="flex-row items-center justify-between p-4">
									<Popover>
										<PopoverTrigger asChild>
											<Button variant="outline" size="sm">
												{formatter.dateTime(new Date(date.watchedDate), {
												month: 'long',
												year: 'numeric',
												day: 'numeric',
												})}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0 flex flex-col justify-center">
											<Calendar
											locale={locale == 'fr-FR' ? fr : enUS}
											mode="single"
											selected={new Date(date.watchedDate ?? '')}
											onSelect={(newDate) => newDate && handleUpdateDate({ ...date, watchedDate: newDate.toISOString() })}
											className="rounded-md border"
											startMonth={new Date('1900-01-01')}
											endMonth={new Date()}
											hidden={[{ before: new Date('1900-01-01')}]}
											/>
										</PopoverContent>
									</Popover>
									<Button variant="outline" size="icon" onClick={() => handleDeleteDate(date.id)} disabled={isDeletePending || isUpdatePending}>
										<Icons.X />
									</Button>
								</Card>
							))
						))}
					</div>
				</ScrollArea>
			</ModalBody>
			<ModalFooter>
				<Button variant='outline' onClick={() => handleInsertDate(new Date())} disabled={isSetPending}>
					<Icons.add />
					{upperFirst(t('common.messages.add'))}
				</Button>
			</ModalFooter>
		</Modal>
	);
};
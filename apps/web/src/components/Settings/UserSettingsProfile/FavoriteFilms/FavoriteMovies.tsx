// 'use client';

// // import MovieCard from '@/components/Movie/Card/MovieCard';
// import { MouseSensor, TouchSensor } from '@/components/DragNDrop/CustomSensor';
// import { Button } from '@/components/ui/button';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
// import {
//   DndContext,
//   DragEndEvent,
//   UniqueIdentifier,
//   closestCenter,
//   useSensor,
//   useSensors,
// } from '@dnd-kit/core';
// import {
//   SortableContext,
//   arrayMove,
//   horizontalListSortingStrategy,
//   useSortable,
// } from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities';
// import { Plus, X } from 'lucide-react';
// import { Dispatch, SetStateAction, useState } from 'react';
// import SearchFavoriteFilms from './components/SearchFavoriteFilms';
// import { toast } from 'react-hot-toast';

// // UI
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/components/ui/accordion"
// import { Movie } from '@recomendapp/types';
// import Loader from '@/components/Loader/Loader';
// import { useLocale } from 'next-intl';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { useAuth } from '@/context/auth-context';
// import { useSupabaseClient } from '@/context/supabase-context';

// export function FavoriteMovies() {
//   const supabase = useSupabaseClient();
//   const { user } = useAuth();
//   const locale = useLocale();
//   const [modalIsOpen, setModalIsOpen] = useState(false);
//   const queryClient = useQueryClient();


//   const {
//     data: userFavoriteMovies,
//     isLoading,
//   } = useQuery({
//     queryKey: ['user', user?.id, 'favorite_movies'],
//     queryFn: async () => {
//       if (!user?.id) throw Error('Missing user id');
//       const { data, error } = await supabase
//         .from('user_movie_favorite')
//         .select(`
//           *,
//           movie(*)
//         `)
//         .eq('user_id', user?.id)
//       if (error) throw error;
//       return data;
//     },
//     enabled: !!user?.id && !!locale,
//   });

//   const {
//     mutateAsync: insertFavoriteMovie,
//   } = useMutation({
//     mutationFn: async (movie: Movie) => {
//       if (!user?.id) throw new Error('Utilisateur non défini');
//       if (!movie?.id) throw new Error('Aucun film sélectionné');
//       if (!locale) throw new Error('Langue non définie');
//       if (userFavoriteMovies === undefined) throw new Error('Erreur lors de la récupération des films favoris');

//       if (userFavoriteMovies?.some((v: any) => v.movie_id === movie.id))
//         throw new Error('Ce film est déjà dans vos favoris');

//       const { data, error } = await supabase
//         .from('user_movie_favorite')
//         .insert({
//           user_id: user?.id,
//           movie_id: movie.id,
//           position: userFavoriteMovies?.length + 1,
//         })
//         .select();
//       if (error) throw new Error(error.message);
//       return data;
//     },
//     onSuccess: (response) => {
//       // update query
//       queryClient.setQueryData(['user', user?.id, 'favorite_movies'], (oldData: any) => {
//         return [...oldData, response];
//       });
//     },
//     onError: (error) => {
//       toast.error(error.message);
//     },
//   });

//   const sensors = useSensors(
//     useSensor(MouseSensor),
//     useSensor(TouchSensor, {
//       activationConstraint: {
//         delay: 250,
//         tolerance: 5,
//       },
//     })
//   );

//   const handleUpdate = async (movieId: number) => {
//     try {
//       if (!movieId) throw new Error('Aucun film sélectionné');
//       if (!locale) throw new Error('Langue non définie');
      
//       // const { data, error } = await supabase
//       //   .from('movie')
//       //   .select('*')
//       //   .eq('id', movieId)
//       //   .eq('language', locale)
//       //   .single();

//       // if (error) throw new Error(error.message);
//     } catch (error: any) {
//       toast.error(error.message);
//     }
//   }

//   const handleDelete = async (movieId: number) => {
//     try {
//       if (!movieId) throw new Error('Aucun film sélectionné');
//       if (!locale) throw new Error('Langue non définie');
      
//       // const { data, error } = await supabase
//       //   .from('movie')
//       //   .select('*')
//       //   .eq('id', movieId)
//       //   .eq('language', locale)
//       //   .single();

//       // if (error) throw new Error(error.message);
//     } catch (error: any) {
//       toast.error(error.message);
//     }
//   }

//   const onDragEnd = async (event: DragEndEvent) => {
//     const { active, over } = event;

//     if (active.id === over?.id || !active || !over) return;
    
//     // arrayMove(value, Number(active.id) - 1, Number(over.id) - 1);

//     // onChange(arrayMove(value, Number(active.id) - 1, Number(over.id) - 1));
//   };

//   return (
//     <>
//       <Accordion type="single" collapsible className="w-full">
//         <AccordionItem value="1">
//           <AccordionTrigger>Films favoris</AccordionTrigger>
//           <AccordionContent>
//             {(isLoading || userFavoriteMovies === undefined) ? <Loader /> : (
//               <div className="grid grid-cols-4 gap-2">
//                 <DndContext
//                   sensors={sensors}
//                   collisionDetection={closestCenter}
//                   onDragEnd={onDragEnd}
//                 >
//                   <SortableContext
//                     items={userFavoriteMovies.map((_: any, index: number) => ({
//                       id: index + 1,
//                     }))}
//                     strategy={horizontalListSortingStrategy}
//                   >
//                     {userFavoriteMovies.map((favMovie: any, index: number) => (
//                       <SortableFilm
//                         index={index + 1}
//                         key={index + 1}
//                         movie={favMovie.movie}
//                         onDelete={handleDelete}
//                       />
//                     ))}
//                     {userFavoriteMovies.length < 4 && (
//                       <Button
//                         variant={'muted'}
//                         className="h-full"
//                         onClick={() => setModalIsOpen(true)}
//                       >
//                         <Plus />
//                       </Button>
//                     )}
//                   </SortableContext>
//                 </DndContext>
//               </div>
//             )}
//           </AccordionContent>
//         </AccordionItem>
//       </Accordion>
//       <ModalFavoriteFilms
//         open={modalIsOpen}
//         setOpen={setModalIsOpen}
//         onInsert={(movie: Movie) => insertFavoriteMovie(movie)}
//       />
//     </>
//   );
// }

// const SortableFilm = ({
//   movie,
//   index,
//   onDelete,
// }: {
//   movie: Movie;
//   index: number;
//   onDelete: (id: number) => void;
// }) => {
//   const { attributes, listeners, setNodeRef, transform, transition } =
//     useSortable({ id: index as UniqueIdentifier });

//   const style = {
//     transition,
//     transform: CSS.Transform.toString(transform),
//   };

//   if (!movie) return null;

//   return (
//     <div
//       ref={setNodeRef}
//       style={style}
//       {...attributes}
//       {...listeners}
//       className="relative"
//     >
//       <Button
//         variant={'muted'}
//         size={'icon'}
//         className="absolute top-2 right-2 z-1 rounded-full p-0"
//         onClick={() => onDelete(movie.id)}
//         data-no-dnd="true"
//       >
//         <X size={15} />
//       </Button>
//       {/* <MovieCard
//         movie={movie}
//         displayMode="grid"
//         fill
//         sizes={`
//           (max-width: 640px) 96px,
//           (max-width: 1024px) 120px,
//           150px
//         `}
//         disabledActions
//         clickable={false}
//       /> */}
//     </div>
//   );
// };

// const ModalFavoriteFilms = ({
//   open,
//   setOpen,
//   onInsert,
// }: {
//   open: boolean;
//   setOpen: Dispatch<SetStateAction<boolean>>;
//   onInsert: (movie: Movie) => void;
// }) => {
//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogContent className="max-w-3xl h-2/3">
//         <DialogHeader>
//           <DialogTitle>Ajouter un film favori</DialogTitle>
//         </DialogHeader>
//         <SearchFavoriteFilms onClick={async (movie: Movie) => await onInsert(movie)}/>
//       </DialogContent>
//     </Dialog>
//   );
// };

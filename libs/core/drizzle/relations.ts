// import { relations } from 'drizzle-orm/relations';
// import {
//   userReviewsMovie,
//   userReviewMovieLikes,
//   user,
//   userReviewsTvSeries,
//   userReviewTvSeriesLikes,
//   tmdbMovie,
//   playlistItemsMovie,
//   playlists,
//   tmdbTvSeries,
//   playlistItemsTvSeries,
//   explore,
//   exploreItems,
//   userActivitiesMovie,
//   userActivitiesTvSeries,
//   userBilling,
//   subscriptions,
//   userDeletionRequests,
//   tmdbTvSeriesCredits,
//   tmdbTvSeriesRoles,
//   tmdbNetwork,
//   tmdbNetworkAlternativeName,
//   tmdbCompany,
//   playlistsLikes,
//   tmdbNetworkImage,
//   mediaMovieStats,
//   tmdbCompanyAlternativeName,
//   tmdbCompanyImage,
//   mediaTvSeriesStats,
//   playlistGuests,
//   userFollower,
//   userFriend,
//   tmdbCollection,
//   tmdbCollectionImage,
//   tmdbCollectionTranslation,
//   userRecosMovie,
//   userWatchlistsMovie,
//   userWatchlistsTvSeries,
//   userRecosTvSeries,
//   tmdbPerson,
//   userPersonFollower,
//   tmdbDepartment,
//   tmdbJobTranslation,
//   feed,
//   tmdbPersonAlsoKnownAs,
//   tmdbPersonTranslation,
//   tmdbPersonImage,
//   tmdbPersonExternalId,
//   tmdbTvSeriesSeasons,
//   tmdbTvSeriesEpisodes,
//   tmdbTvSeriesEpisodesCredits,
//   playlistsFeatured,
//   playlistsSaved,
//   tmdbTvSeriesTranslations,
//   tmdbCountry,
//   tmdbTvSeriesProductionCountries,
//   tmdbGenre,
//   tmdbTvSeriesGenres,
//   tmdbLanguage,
//   tmdbTvSeriesLanguages,
//   tmdbTvSeriesNetworks,
//   tmdbTvSeriesOriginCountry,
//   tmdbTvSeriesSpokenLanguages,
//   tmdbTvSeriesImages,
//   tmdbTvSeriesProductionCompanies,
//   tmdbTvSeriesAlternativeTitles,
//   tmdbTvSeriesContentRatings,
//   tmdbKeyword,
//   tmdbTvSeriesKeywords,
//   tmdbTvSeriesSeasonsTranslations,
//   tmdbTvSeriesExternalIds,
//   tmdbGender,
//   tmdbTvSeriesSeasonsCredits,
//   tmdbTvSeriesVideos,
//   tmdbGenreTranslation,
//   tmdbMovieCredits,
//   tmdbMovieGenres,
//   tmdbMovieKeywords,
//   tmdbMovieProductionCompanies,
//   tmdbMovieProductionCountries,
//   tmdbMovieReleaseDates,
//   tmdbMovieOriginCountry,
//   tmdbMovieSpokenLanguages,
//   tmdbMovieExternalIds,
//   tmdbMovieRoles,
//   tmdbMovieVideos,
//   tmdbMovieTranslations,
//   tmdbMovieImages,
//   tmdbMovieAlternativeTitles,
//   usersInAuth,
//   supportedLanguagesInConfig,
//   userNotificationTokens,
// } from './schema';

// export const userReviewMovieLikesRelations = relations(
//   userReviewMovieLikes,
//   ({ one }) => ({
//     userReviewsMovie: one(userReviewsMovie, {
//       fields: [userReviewMovieLikes.reviewId],
//       references: [userReviewsMovie.id],
//     }),
//     user: one(user, {
//       fields: [userReviewMovieLikes.userId],
//       references: [user.id],
//     }),
//   }),
// );

// export const userReviewsMovieRelations = relations(
//   userReviewsMovie,
//   ({ one, many }) => ({
//     userReviewMovieLikes: many(userReviewMovieLikes),
//     userActivitiesMovie: one(userActivitiesMovie, {
//       fields: [userReviewsMovie.id],
//       references: [userActivitiesMovie.id],
//     }),
//   }),
// );

// export const userRelations = relations(user, ({ one, many }) => ({
//   userReviewMovieLikes: many(userReviewMovieLikes),
//   userReviewTvSeriesLikes: many(userReviewTvSeriesLikes),
//   playlistItemsMovies: many(playlistItemsMovie),
//   playlistItemsTvSeries: many(playlistItemsTvSeries),
//   userBillings: many(userBilling),
//   subscriptions: many(subscriptions),
//   userDeletionRequests: many(userDeletionRequests),
//   playlistsLikes: many(playlistsLikes),
//   playlistGuests: many(playlistGuests),
//   playlists: many(playlists),
//   userFollowers_followeeId: many(userFollower, {
//     relationName: 'userFollower_followeeId_user_id',
//   }),
//   userFollowers_userId: many(userFollower, {
//     relationName: 'userFollower_userId_user_id',
//   }),
//   userFriends_friendId: many(userFriend, {
//     relationName: 'userFriend_friendId_user_id',
//   }),
//   userFriends_userId: many(userFriend, {
//     relationName: 'userFriend_userId_user_id',
//   }),
//   userRecosMovies_senderId: many(userRecosMovie, {
//     relationName: 'userRecosMovie_senderId_user_id',
//   }),
//   userRecosMovies_userId: many(userRecosMovie, {
//     relationName: 'userRecosMovie_userId_user_id',
//   }),
//   userWatchlistsMovies: many(userWatchlistsMovie),
//   userWatchlistsTvSeries: many(userWatchlistsTvSeries),
//   userRecosTvSeries_senderId: many(userRecosTvSeries, {
//     relationName: 'userRecosTvSeries_senderId_user_id',
//   }),
//   userRecosTvSeries_userId: many(userRecosTvSeries, {
//     relationName: 'userRecosTvSeries_userId_user_id',
//   }),
//   userActivitiesTvSeries: many(userActivitiesTvSeries),
//   userActivitiesMovies: many(userActivitiesMovie),
//   userPersonFollowers: many(userPersonFollower),
//   feeds: many(feed),
//   playlistsSaveds: many(playlistsSaved),
//   usersInAuth: one(usersInAuth, {
//     fields: [user.id],
//     references: [usersInAuth.id],
//   }),
//   supportedLanguagesInConfig: one(supportedLanguagesInConfig, {
//     fields: [user.language],
//     references: [supportedLanguagesInConfig.language],
//   }),
//   userNotificationTokens: many(userNotificationTokens),
// }));

// export const userReviewTvSeriesLikesRelations = relations(
//   userReviewTvSeriesLikes,
//   ({ one }) => ({
//     userReviewsTvSery: one(userReviewsTvSeries, {
//       fields: [userReviewTvSeriesLikes.reviewId],
//       references: [userReviewsTvSeries.id],
//     }),
//     user: one(user, {
//       fields: [userReviewTvSeriesLikes.userId],
//       references: [user.id],
//     }),
//   }),
// );

// export const userReviewsTvSeriesRelations = relations(
//   userReviewsTvSeries,
//   ({ one, many }) => ({
//     userReviewTvSeriesLikes: many(userReviewTvSeriesLikes),
//     userActivitiesTvSery: one(userActivitiesTvSeries, {
//       fields: [userReviewsTvSeries.id],
//       references: [userActivitiesTvSeries.id],
//     }),
//   }),
// );

// export const playlistItemsMovieRelations = relations(
//   playlistItemsMovie,
//   ({ one }) => ({
//     tmdbMovie: one(tmdbMovie, {
//       fields: [playlistItemsMovie.movieId],
//       references: [tmdbMovie.id],
//     }),
//     playlist: one(playlists, {
//       fields: [playlistItemsMovie.playlistId],
//       references: [playlists.id],
//     }),
//     user: one(user, {
//       fields: [playlistItemsMovie.userId],
//       references: [user.id],
//     }),
//   }),
// );

// export const tmdbMovieRelations = relations(tmdbMovie, ({ one, many }) => ({
//   playlistItemsMovies: many(playlistItemsMovie),
//   exploreItems: many(exploreItems),
//   mediaMovieStats: many(mediaMovieStats),
//   userRecosMovies: many(userRecosMovie),
//   userWatchlistsMovies: many(userWatchlistsMovie),
//   userActivitiesMovies: many(userActivitiesMovie),
//   tmdbMovieCredits: many(tmdbMovieCredits),
//   tmdbMovieGenres: many(tmdbMovieGenres),
//   tmdbMovieKeywords: many(tmdbMovieKeywords),
//   tmdbMovieProductionCompanies: many(tmdbMovieProductionCompanies),
//   tmdbMovieProductionCountries: many(tmdbMovieProductionCountries),
//   tmdbMovieReleaseDates: many(tmdbMovieReleaseDates),
//   tmdbMovieOriginCountries: many(tmdbMovieOriginCountry),
//   tmdbMovieSpokenLanguages: many(tmdbMovieSpokenLanguages),
//   tmdbMovieExternalIds: many(tmdbMovieExternalIds),
//   tmdbMovieVideos: many(tmdbMovieVideos),
//   tmdbMovieTranslations: many(tmdbMovieTranslations),
//   tmdbCollection: one(tmdbCollection, {
//     fields: [tmdbMovie.belongsToCollection],
//     references: [tmdbCollection.id],
//   }),
//   tmdbMovieImages: many(tmdbMovieImages),
//   tmdbMovieAlternativeTitles: many(tmdbMovieAlternativeTitles),
// }));

// export const playlistsRelations = relations(playlists, ({ one, many }) => ({
//   playlistItemsMovies: many(playlistItemsMovie),
//   playlistItemsTvSeries: many(playlistItemsTvSeries),
//   playlistsLikes: many(playlistsLikes),
//   playlistGuests: many(playlistGuests),
//   user: one(user, {
//     fields: [playlists.userId],
//     references: [user.id],
//   }),
//   playlistsFeatureds: many(playlistsFeatured),
//   playlistsSaveds: many(playlistsSaved),
// }));

// export const playlistItemsTvSeriesRelations = relations(
//   playlistItemsTvSeries,
//   ({ one }) => ({
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [playlistItemsTvSeries.tvSeriesId],
//       references: [tmdbTvSeries.id],
//     }),
//     playlist: one(playlists, {
//       fields: [playlistItemsTvSeries.playlistId],
//       references: [playlists.id],
//     }),
//     user: one(user, {
//       fields: [playlistItemsTvSeries.userId],
//       references: [user.id],
//     }),
//   }),
// );

// export const tmdbTvSeriesRelations = relations(tmdbTvSeries, ({ many }) => ({
//   playlistItemsTvSeries: many(playlistItemsTvSeries),
//   mediaTvSeriesStats: many(mediaTvSeriesStats),
//   userWatchlistsTvSeries: many(userWatchlistsTvSeries),
//   userRecosTvSeries: many(userRecosTvSeries),
//   userActivitiesTvSeries: many(userActivitiesTvSeries),
//   tmdbTvSeriesSeasons: many(tmdbTvSeriesSeasons),
//   tmdbTvSeriesTranslations: many(tmdbTvSeriesTranslations),
//   tmdbTvSeriesProductionCountries: many(tmdbTvSeriesProductionCountries),
//   tmdbTvSeriesGenres: many(tmdbTvSeriesGenres),
//   tmdbTvSeriesLanguages: many(tmdbTvSeriesLanguages),
//   tmdbTvSeriesNetworks: many(tmdbTvSeriesNetworks),
//   tmdbTvSeriesOriginCountries: many(tmdbTvSeriesOriginCountry),
//   tmdbTvSeriesSpokenLanguages: many(tmdbTvSeriesSpokenLanguages),
//   tmdbTvSeriesImages: many(tmdbTvSeriesImages),
//   tmdbTvSeriesProductionCompanies: many(tmdbTvSeriesProductionCompanies),
//   tmdbTvSeriesAlternativeTitles: many(tmdbTvSeriesAlternativeTitles),
//   tmdbTvSeriesContentRatings: many(tmdbTvSeriesContentRatings),
//   tmdbTvSeriesKeywords: many(tmdbTvSeriesKeywords),
//   tmdbTvSeriesExternalIds: many(tmdbTvSeriesExternalIds),
//   tmdbTvSeriesVideos: many(tmdbTvSeriesVideos),
//   tmdbTvSeriesCredits: many(tmdbTvSeriesCredits),
// }));

// export const exploreItemsRelations = relations(exploreItems, ({ one }) => ({
//   explore: one(explore, {
//     fields: [exploreItems.exploreId],
//     references: [explore.id],
//   }),
//   tmdbMovie: one(tmdbMovie, {
//     fields: [exploreItems.movieId],
//     references: [tmdbMovie.id],
//   }),
// }));

// export const exploreRelations = relations(explore, ({ many }) => ({
//   exploreItems: many(exploreItems),
// }));

// export const userActivitiesMovieRelations = relations(
//   userActivitiesMovie,
//   ({ one, many }) => ({
//     userReviewsMovies: many(userReviewsMovie),
//     tmdbMovie: one(tmdbMovie, {
//       fields: [userActivitiesMovie.movieId],
//       references: [tmdbMovie.id],
//     }),
//     user: one(user, {
//       fields: [userActivitiesMovie.userId],
//       references: [user.id],
//     }),
//   }),
// );

// export const userActivitiesTvSeriesRelations = relations(
//   userActivitiesTvSeries,
//   ({ one, many }) => ({
//     userReviewsTvSeries: many(userReviewsTvSeries),
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [userActivitiesTvSeries.tvSeriesId],
//       references: [tmdbTvSeries.id],
//     }),
//     user: one(user, {
//       fields: [userActivitiesTvSeries.userId],
//       references: [user.id],
//     }),
//   }),
// );

// export const userBillingRelations = relations(userBilling, ({ one }) => ({
//   user: one(user, {
//     fields: [userBilling.userId],
//     references: [user.id],
//   }),
// }));

// export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
//   user: one(user, {
//     fields: [subscriptions.userId],
//     references: [user.id],
//   }),
// }));

// export const userDeletionRequestsRelations = relations(
//   userDeletionRequests,
//   ({ one }) => ({
//     user: one(user, {
//       fields: [userDeletionRequests.userId],
//       references: [user.id],
//     }),
//   }),
// );

// export const tmdbTvSeriesRolesRelations = relations(
//   tmdbTvSeriesRoles,
//   ({ one }) => ({
//     tmdbTvSeriesCredit: one(tmdbTvSeriesCredits, {
//       fields: [tmdbTvSeriesRoles.creditId],
//       references: [tmdbTvSeriesCredits.id],
//     }),
//   }),
// );

// export const tmdbTvSeriesCreditsRelations = relations(
//   tmdbTvSeriesCredits,
//   ({ one, many }) => ({
//     tmdbTvSeriesRoles: many(tmdbTvSeriesRoles),
//     tmdbTvSeriesEpisodesCredits: many(tmdbTvSeriesEpisodesCredits),
//     tmdbTvSeriesSeasonsCredits: many(tmdbTvSeriesSeasonsCredits),
//     tmdbPerson: one(tmdbPerson, {
//       fields: [tmdbTvSeriesCredits.personId],
//       references: [tmdbPerson.id],
//     }),
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [tmdbTvSeriesCredits.serieId],
//       references: [tmdbTvSeries.id],
//     }),
//   }),
// );

// export const tmdbNetworkAlternativeNameRelations = relations(
//   tmdbNetworkAlternativeName,
//   ({ one }) => ({
//     tmdbNetwork: one(tmdbNetwork, {
//       fields: [tmdbNetworkAlternativeName.network],
//       references: [tmdbNetwork.id],
//     }),
//   }),
// );

// export const tmdbNetworkRelations = relations(tmdbNetwork, ({ many }) => ({
//   tmdbNetworkAlternativeNames: many(tmdbNetworkAlternativeName),
//   tmdbNetworkImages: many(tmdbNetworkImage),
//   tmdbTvSeriesNetworks: many(tmdbTvSeriesNetworks),
// }));

// export const tmdbCompanyRelations = relations(tmdbCompany, ({ one, many }) => ({
//   tmdbCompany: one(tmdbCompany, {
//     fields: [tmdbCompany.parentCompany],
//     references: [tmdbCompany.id],
//     relationName: 'tmdbCompany_parentCompany_tmdbCompany_id',
//   }),
//   tmdbCompanies: many(tmdbCompany, {
//     relationName: 'tmdbCompany_parentCompany_tmdbCompany_id',
//   }),
//   tmdbCompanyAlternativeNames: many(tmdbCompanyAlternativeName),
//   tmdbCompanyImages: many(tmdbCompanyImage),
//   tmdbTvSeriesProductionCompanies: many(tmdbTvSeriesProductionCompanies),
//   tmdbMovieProductionCompanies: many(tmdbMovieProductionCompanies),
// }));

// export const playlistsLikesRelations = relations(playlistsLikes, ({ one }) => ({
//   playlist: one(playlists, {
//     fields: [playlistsLikes.playlistId],
//     references: [playlists.id],
//   }),
//   user: one(user, {
//     fields: [playlistsLikes.userId],
//     references: [user.id],
//   }),
// }));

// export const tmdbNetworkImageRelations = relations(
//   tmdbNetworkImage,
//   ({ one }) => ({
//     tmdbNetwork: one(tmdbNetwork, {
//       fields: [tmdbNetworkImage.network],
//       references: [tmdbNetwork.id],
//     }),
//   }),
// );

// export const mediaMovieStatsRelations = relations(
//   mediaMovieStats,
//   ({ one }) => ({
//     tmdbMovie: one(tmdbMovie, {
//       fields: [mediaMovieStats.id],
//       references: [tmdbMovie.id],
//     }),
//   }),
// );

// export const tmdbCompanyAlternativeNameRelations = relations(
//   tmdbCompanyAlternativeName,
//   ({ one }) => ({
//     tmdbCompany: one(tmdbCompany, {
//       fields: [tmdbCompanyAlternativeName.company],
//       references: [tmdbCompany.id],
//     }),
//   }),
// );

// export const tmdbCompanyImageRelations = relations(
//   tmdbCompanyImage,
//   ({ one }) => ({
//     tmdbCompany: one(tmdbCompany, {
//       fields: [tmdbCompanyImage.company],
//       references: [tmdbCompany.id],
//     }),
//   }),
// );

// export const mediaTvSeriesStatsRelations = relations(
//   mediaTvSeriesStats,
//   ({ one }) => ({
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [mediaTvSeriesStats.id],
//       references: [tmdbTvSeries.id],
//     }),
//   }),
// );

// export const playlistGuestsRelations = relations(playlistGuests, ({ one }) => ({
//   playlist: one(playlists, {
//     fields: [playlistGuests.playlistId],
//     references: [playlists.id],
//   }),
//   user: one(user, {
//     fields: [playlistGuests.userId],
//     references: [user.id],
//   }),
// }));

// export const userFollowerRelations = relations(userFollower, ({ one }) => ({
//   user_followeeId: one(user, {
//     fields: [userFollower.followeeId],
//     references: [user.id],
//     relationName: 'userFollower_followeeId_user_id',
//   }),
//   user_userId: one(user, {
//     fields: [userFollower.userId],
//     references: [user.id],
//     relationName: 'userFollower_userId_user_id',
//   }),
// }));

// export const userFriendRelations = relations(userFriend, ({ one }) => ({
//   user_friendId: one(user, {
//     fields: [userFriend.friendId],
//     references: [user.id],
//     relationName: 'userFriend_friendId_user_id',
//   }),
//   user_userId: one(user, {
//     fields: [userFriend.userId],
//     references: [user.id],
//     relationName: 'userFriend_userId_user_id',
//   }),
// }));

// export const tmdbCollectionImageRelations = relations(
//   tmdbCollectionImage,
//   ({ one }) => ({
//     tmdbCollection: one(tmdbCollection, {
//       fields: [tmdbCollectionImage.collection],
//       references: [tmdbCollection.id],
//     }),
//   }),
// );

// export const tmdbCollectionRelations = relations(
//   tmdbCollection,
//   ({ many }) => ({
//     tmdbCollectionImages: many(tmdbCollectionImage),
//     tmdbCollectionTranslations: many(tmdbCollectionTranslation),
//     tmdbMovies: many(tmdbMovie),
//   }),
// );

// export const tmdbCollectionTranslationRelations = relations(
//   tmdbCollectionTranslation,
//   ({ one }) => ({
//     tmdbCollection: one(tmdbCollection, {
//       fields: [tmdbCollectionTranslation.collection],
//       references: [tmdbCollection.id],
//     }),
//   }),
// );

// export const userRecosMovieRelations = relations(userRecosMovie, ({ one }) => ({
//   tmdbMovie: one(tmdbMovie, {
//     fields: [userRecosMovie.movieId],
//     references: [tmdbMovie.id],
//   }),
//   user_senderId: one(user, {
//     fields: [userRecosMovie.senderId],
//     references: [user.id],
//     relationName: 'userRecosMovie_senderId_user_id',
//   }),
//   user_userId: one(user, {
//     fields: [userRecosMovie.userId],
//     references: [user.id],
//     relationName: 'userRecosMovie_userId_user_id',
//   }),
// }));

// export const userWatchlistsMovieRelations = relations(
//   userWatchlistsMovie,
//   ({ one }) => ({
//     tmdbMovie: one(tmdbMovie, {
//       fields: [userWatchlistsMovie.movieId],
//       references: [tmdbMovie.id],
//     }),
//     user: one(user, {
//       fields: [userWatchlistsMovie.userId],
//       references: [user.id],
//     }),
//   }),
// );

// export const userWatchlistsTvSeriesRelations = relations(
//   userWatchlistsTvSeries,
//   ({ one }) => ({
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [userWatchlistsTvSeries.tvSeriesId],
//       references: [tmdbTvSeries.id],
//     }),
//     user: one(user, {
//       fields: [userWatchlistsTvSeries.userId],
//       references: [user.id],
//     }),
//   }),
// );

// export const userRecosTvSeriesRelations = relations(
//   userRecosTvSeries,
//   ({ one }) => ({
//     user_senderId: one(user, {
//       fields: [userRecosTvSeries.senderId],
//       references: [user.id],
//       relationName: 'userRecosTvSeries_senderId_user_id',
//     }),
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [userRecosTvSeries.tvSeriesId],
//       references: [tmdbTvSeries.id],
//     }),
//     user_userId: one(user, {
//       fields: [userRecosTvSeries.userId],
//       references: [user.id],
//       relationName: 'userRecosTvSeries_userId_user_id',
//     }),
//   }),
// );

// export const userPersonFollowerRelations = relations(
//   userPersonFollower,
//   ({ one }) => ({
//     tmdbPerson: one(tmdbPerson, {
//       fields: [userPersonFollower.personId],
//       references: [tmdbPerson.id],
//     }),
//     user: one(user, {
//       fields: [userPersonFollower.userId],
//       references: [user.id],
//     }),
//   }),
// );

// export const tmdbPersonRelations = relations(tmdbPerson, ({ one, many }) => ({
//   userPersonFollowers: many(userPersonFollower),
//   tmdbPersonAlsoKnownAs: many(tmdbPersonAlsoKnownAs),
//   tmdbPersonTranslations: many(tmdbPersonTranslation),
//   tmdbPersonImages: many(tmdbPersonImage),
//   tmdbPersonExternalIds: many(tmdbPersonExternalId),
//   tmdbGender: one(tmdbGender, {
//     fields: [tmdbPerson.gender],
//     references: [tmdbGender.id],
//   }),
//   tmdbTvSeriesCredits: many(tmdbTvSeriesCredits),
//   tmdbMovieCredits: many(tmdbMovieCredits),
// }));

// export const tmdbJobTranslationRelations = relations(
//   tmdbJobTranslation,
//   ({ one }) => ({
//     tmdbDepartment: one(tmdbDepartment, {
//       fields: [tmdbJobTranslation.departmentId],
//       references: [tmdbDepartment.id],
//     }),
//   }),
// );

// export const tmdbDepartmentRelations = relations(
//   tmdbDepartment,
//   ({ many }) => ({
//     tmdbJobTranslations: many(tmdbJobTranslation),
//   }),
// );

// export const feedRelations = relations(feed, ({ one }) => ({
//   user: one(user, {
//     fields: [feed.userId],
//     references: [user.id],
//   }),
// }));

// export const tmdbPersonAlsoKnownAsRelations = relations(
//   tmdbPersonAlsoKnownAs,
//   ({ one }) => ({
//     tmdbPerson: one(tmdbPerson, {
//       fields: [tmdbPersonAlsoKnownAs.person],
//       references: [tmdbPerson.id],
//     }),
//   }),
// );

// export const tmdbPersonTranslationRelations = relations(
//   tmdbPersonTranslation,
//   ({ one }) => ({
//     tmdbPerson: one(tmdbPerson, {
//       fields: [tmdbPersonTranslation.person],
//       references: [tmdbPerson.id],
//     }),
//   }),
// );

// export const tmdbPersonImageRelations = relations(
//   tmdbPersonImage,
//   ({ one }) => ({
//     tmdbPerson: one(tmdbPerson, {
//       fields: [tmdbPersonImage.person],
//       references: [tmdbPerson.id],
//     }),
//   }),
// );

// export const tmdbPersonExternalIdRelations = relations(
//   tmdbPersonExternalId,
//   ({ one }) => ({
//     tmdbPerson: one(tmdbPerson, {
//       fields: [tmdbPersonExternalId.person],
//       references: [tmdbPerson.id],
//     }),
//   }),
// );

// export const tmdbTvSeriesSeasonsRelations = relations(
//   tmdbTvSeriesSeasons,
//   ({ one, many }) => ({
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [tmdbTvSeriesSeasons.serieId],
//       references: [tmdbTvSeries.id],
//     }),
//     tmdbTvSeriesEpisodes: many(tmdbTvSeriesEpisodes),
//     tmdbTvSeriesSeasonsTranslations: many(tmdbTvSeriesSeasonsTranslations),
//     tmdbTvSeriesSeasonsCredits: many(tmdbTvSeriesSeasonsCredits),
//   }),
// );

// export const tmdbTvSeriesEpisodesRelations = relations(
//   tmdbTvSeriesEpisodes,
//   ({ one, many }) => ({
//     tmdbTvSeriesSeason: one(tmdbTvSeriesSeasons, {
//       fields: [tmdbTvSeriesEpisodes.seasonId],
//       references: [tmdbTvSeriesSeasons.id],
//     }),
//     tmdbTvSeriesEpisodesCredits: many(tmdbTvSeriesEpisodesCredits),
//   }),
// );

// export const tmdbTvSeriesEpisodesCreditsRelations = relations(
//   tmdbTvSeriesEpisodesCredits,
//   ({ one }) => ({
//     tmdbTvSeriesCredit: one(tmdbTvSeriesCredits, {
//       fields: [tmdbTvSeriesEpisodesCredits.creditId],
//       references: [tmdbTvSeriesCredits.id],
//     }),
//     tmdbTvSeriesEpisode: one(tmdbTvSeriesEpisodes, {
//       fields: [tmdbTvSeriesEpisodesCredits.episodeId],
//       references: [tmdbTvSeriesEpisodes.id],
//     }),
//   }),
// );

// export const playlistsFeaturedRelations = relations(
//   playlistsFeatured,
//   ({ one }) => ({
//     playlist: one(playlists, {
//       fields: [playlistsFeatured.id],
//       references: [playlists.id],
//     }),
//   }),
// );

// export const playlistsSavedRelations = relations(playlistsSaved, ({ one }) => ({
//   playlist: one(playlists, {
//     fields: [playlistsSaved.playlistId],
//     references: [playlists.id],
//   }),
//   user: one(user, {
//     fields: [playlistsSaved.userId],
//     references: [user.id],
//   }),
// }));

// export const tmdbTvSeriesTranslationsRelations = relations(
//   tmdbTvSeriesTranslations,
//   ({ one }) => ({
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [tmdbTvSeriesTranslations.serieId],
//       references: [tmdbTvSeries.id],
//     }),
//   }),
// );

// export const tmdbTvSeriesProductionCountriesRelations = relations(
//   tmdbTvSeriesProductionCountries,
//   ({ one }) => ({
//     tmdbCountry: one(tmdbCountry, {
//       fields: [tmdbTvSeriesProductionCountries.iso31661],
//       references: [tmdbCountry.iso31661],
//     }),
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [tmdbTvSeriesProductionCountries.serieId],
//       references: [tmdbTvSeries.id],
//     }),
//   }),
// );

// export const tmdbCountryRelations = relations(tmdbCountry, ({ many }) => ({
//   tmdbTvSeriesProductionCountries: many(tmdbTvSeriesProductionCountries),
//   tmdbTvSeriesOriginCountries: many(tmdbTvSeriesOriginCountry),
//   tmdbMovieProductionCountries: many(tmdbMovieProductionCountries),
//   tmdbMovieReleaseDates: many(tmdbMovieReleaseDates),
//   tmdbMovieOriginCountries: many(tmdbMovieOriginCountry),
//   tmdbMovieVideos: many(tmdbMovieVideos),
// }));

// export const tmdbTvSeriesGenresRelations = relations(
//   tmdbTvSeriesGenres,
//   ({ one }) => ({
//     tmdbGenre: one(tmdbGenre, {
//       fields: [tmdbTvSeriesGenres.genreId],
//       references: [tmdbGenre.id],
//     }),
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [tmdbTvSeriesGenres.serieId],
//       references: [tmdbTvSeries.id],
//     }),
//   }),
// );

// export const tmdbGenreRelations = relations(tmdbGenre, ({ many }) => ({
//   tmdbTvSeriesGenres: many(tmdbTvSeriesGenres),
//   tmdbGenreTranslations: many(tmdbGenreTranslation),
//   tmdbMovieGenres: many(tmdbMovieGenres),
// }));

// export const tmdbTvSeriesLanguagesRelations = relations(
//   tmdbTvSeriesLanguages,
//   ({ one }) => ({
//     tmdbLanguage: one(tmdbLanguage, {
//       fields: [tmdbTvSeriesLanguages.iso6391],
//       references: [tmdbLanguage.iso6391],
//     }),
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [tmdbTvSeriesLanguages.serieId],
//       references: [tmdbTvSeries.id],
//     }),
//   }),
// );

// export const tmdbLanguageRelations = relations(tmdbLanguage, ({ many }) => ({
//   tmdbTvSeriesLanguages: many(tmdbTvSeriesLanguages),
//   tmdbTvSeriesSpokenLanguages: many(tmdbTvSeriesSpokenLanguages),
//   tmdbMovieReleaseDates: many(tmdbMovieReleaseDates),
//   tmdbMovieSpokenLanguages: many(tmdbMovieSpokenLanguages),
// }));

// export const tmdbTvSeriesNetworksRelations = relations(
//   tmdbTvSeriesNetworks,
//   ({ one }) => ({
//     tmdbNetwork: one(tmdbNetwork, {
//       fields: [tmdbTvSeriesNetworks.networkId],
//       references: [tmdbNetwork.id],
//     }),
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [tmdbTvSeriesNetworks.serieId],
//       references: [tmdbTvSeries.id],
//     }),
//   }),
// );

// export const tmdbTvSeriesOriginCountryRelations = relations(
//   tmdbTvSeriesOriginCountry,
//   ({ one }) => ({
//     tmdbCountry: one(tmdbCountry, {
//       fields: [tmdbTvSeriesOriginCountry.iso31661],
//       references: [tmdbCountry.iso31661],
//     }),
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [tmdbTvSeriesOriginCountry.serieId],
//       references: [tmdbTvSeries.id],
//     }),
//   }),
// );

// export const tmdbTvSeriesSpokenLanguagesRelations = relations(
//   tmdbTvSeriesSpokenLanguages,
//   ({ one }) => ({
//     tmdbLanguage: one(tmdbLanguage, {
//       fields: [tmdbTvSeriesSpokenLanguages.iso6391],
//       references: [tmdbLanguage.iso6391],
//     }),
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [tmdbTvSeriesSpokenLanguages.serieId],
//       references: [tmdbTvSeries.id],
//     }),
//   }),
// );

// export const tmdbTvSeriesImagesRelations = relations(
//   tmdbTvSeriesImages,
//   ({ one }) => ({
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [tmdbTvSeriesImages.serieId],
//       references: [tmdbTvSeries.id],
//     }),
//   }),
// );

// export const tmdbTvSeriesProductionCompaniesRelations = relations(
//   tmdbTvSeriesProductionCompanies,
//   ({ one }) => ({
//     tmdbCompany: one(tmdbCompany, {
//       fields: [tmdbTvSeriesProductionCompanies.companyId],
//       references: [tmdbCompany.id],
//     }),
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [tmdbTvSeriesProductionCompanies.serieId],
//       references: [tmdbTvSeries.id],
//     }),
//   }),
// );

// export const tmdbTvSeriesAlternativeTitlesRelations = relations(
//   tmdbTvSeriesAlternativeTitles,
//   ({ one }) => ({
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [tmdbTvSeriesAlternativeTitles.serieId],
//       references: [tmdbTvSeries.id],
//     }),
//   }),
// );

// export const tmdbTvSeriesContentRatingsRelations = relations(
//   tmdbTvSeriesContentRatings,
//   ({ one }) => ({
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [tmdbTvSeriesContentRatings.serieId],
//       references: [tmdbTvSeries.id],
//     }),
//   }),
// );

// export const tmdbTvSeriesKeywordsRelations = relations(
//   tmdbTvSeriesKeywords,
//   ({ one }) => ({
//     tmdbKeyword: one(tmdbKeyword, {
//       fields: [tmdbTvSeriesKeywords.keywordId],
//       references: [tmdbKeyword.id],
//     }),
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [tmdbTvSeriesKeywords.serieId],
//       references: [tmdbTvSeries.id],
//     }),
//   }),
// );

// export const tmdbKeywordRelations = relations(tmdbKeyword, ({ many }) => ({
//   tmdbTvSeriesKeywords: many(tmdbTvSeriesKeywords),
//   tmdbMovieKeywords: many(tmdbMovieKeywords),
// }));

// export const tmdbTvSeriesSeasonsTranslationsRelations = relations(
//   tmdbTvSeriesSeasonsTranslations,
//   ({ one }) => ({
//     tmdbTvSeriesSeason: one(tmdbTvSeriesSeasons, {
//       fields: [tmdbTvSeriesSeasonsTranslations.seasonId],
//       references: [tmdbTvSeriesSeasons.id],
//     }),
//   }),
// );

// export const tmdbTvSeriesExternalIdsRelations = relations(
//   tmdbTvSeriesExternalIds,
//   ({ one }) => ({
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [tmdbTvSeriesExternalIds.serieId],
//       references: [tmdbTvSeries.id],
//     }),
//   }),
// );

// export const tmdbGenderRelations = relations(tmdbGender, ({ many }) => ({
//   tmdbPeople: many(tmdbPerson),
// }));

// export const tmdbTvSeriesSeasonsCreditsRelations = relations(
//   tmdbTvSeriesSeasonsCredits,
//   ({ one }) => ({
//     tmdbTvSeriesCredit: one(tmdbTvSeriesCredits, {
//       fields: [tmdbTvSeriesSeasonsCredits.creditId],
//       references: [tmdbTvSeriesCredits.id],
//     }),
//     tmdbTvSeriesSeason: one(tmdbTvSeriesSeasons, {
//       fields: [tmdbTvSeriesSeasonsCredits.seasonId],
//       references: [tmdbTvSeriesSeasons.id],
//     }),
//   }),
// );

// export const tmdbTvSeriesVideosRelations = relations(
//   tmdbTvSeriesVideos,
//   ({ one }) => ({
//     tmdbTvSery: one(tmdbTvSeries, {
//       fields: [tmdbTvSeriesVideos.serieId],
//       references: [tmdbTvSeries.id],
//     }),
//   }),
// );

// export const tmdbGenreTranslationRelations = relations(
//   tmdbGenreTranslation,
//   ({ one }) => ({
//     tmdbGenre: one(tmdbGenre, {
//       fields: [tmdbGenreTranslation.genre],
//       references: [tmdbGenre.id],
//     }),
//   }),
// );

// export const tmdbMovieCreditsRelations = relations(
//   tmdbMovieCredits,
//   ({ one, many }) => ({
//     tmdbMovie: one(tmdbMovie, {
//       fields: [tmdbMovieCredits.movieId],
//       references: [tmdbMovie.id],
//     }),
//     tmdbPerson: one(tmdbPerson, {
//       fields: [tmdbMovieCredits.personId],
//       references: [tmdbPerson.id],
//     }),
//     tmdbMovieRoles: many(tmdbMovieRoles),
//   }),
// );

// export const tmdbMovieGenresRelations = relations(
//   tmdbMovieGenres,
//   ({ one }) => ({
//     tmdbGenre: one(tmdbGenre, {
//       fields: [tmdbMovieGenres.genreId],
//       references: [tmdbGenre.id],
//     }),
//     tmdbMovie: one(tmdbMovie, {
//       fields: [tmdbMovieGenres.movieId],
//       references: [tmdbMovie.id],
//     }),
//   }),
// );

// export const tmdbMovieKeywordsRelations = relations(
//   tmdbMovieKeywords,
//   ({ one }) => ({
//     tmdbKeyword: one(tmdbKeyword, {
//       fields: [tmdbMovieKeywords.keywordId],
//       references: [tmdbKeyword.id],
//     }),
//     tmdbMovie: one(tmdbMovie, {
//       fields: [tmdbMovieKeywords.movieId],
//       references: [tmdbMovie.id],
//     }),
//   }),
// );

// export const tmdbMovieProductionCompaniesRelations = relations(
//   tmdbMovieProductionCompanies,
//   ({ one }) => ({
//     tmdbCompany: one(tmdbCompany, {
//       fields: [tmdbMovieProductionCompanies.companyId],
//       references: [tmdbCompany.id],
//     }),
//     tmdbMovie: one(tmdbMovie, {
//       fields: [tmdbMovieProductionCompanies.movieId],
//       references: [tmdbMovie.id],
//     }),
//   }),
// );

// export const tmdbMovieProductionCountriesRelations = relations(
//   tmdbMovieProductionCountries,
//   ({ one }) => ({
//     tmdbCountry: one(tmdbCountry, {
//       fields: [tmdbMovieProductionCountries.iso31661],
//       references: [tmdbCountry.iso31661],
//     }),
//     tmdbMovie: one(tmdbMovie, {
//       fields: [tmdbMovieProductionCountries.movieId],
//       references: [tmdbMovie.id],
//     }),
//   }),
// );

// export const tmdbMovieReleaseDatesRelations = relations(
//   tmdbMovieReleaseDates,
//   ({ one }) => ({
//     tmdbCountry: one(tmdbCountry, {
//       fields: [tmdbMovieReleaseDates.iso31661],
//       references: [tmdbCountry.iso31661],
//     }),
//     tmdbLanguage: one(tmdbLanguage, {
//       fields: [tmdbMovieReleaseDates.iso6391],
//       references: [tmdbLanguage.iso6391],
//     }),
//     tmdbMovie: one(tmdbMovie, {
//       fields: [tmdbMovieReleaseDates.movieId],
//       references: [tmdbMovie.id],
//     }),
//   }),
// );

// export const tmdbMovieOriginCountryRelations = relations(
//   tmdbMovieOriginCountry,
//   ({ one }) => ({
//     tmdbCountry: one(tmdbCountry, {
//       fields: [tmdbMovieOriginCountry.iso31661],
//       references: [tmdbCountry.iso31661],
//     }),
//     tmdbMovie: one(tmdbMovie, {
//       fields: [tmdbMovieOriginCountry.movieId],
//       references: [tmdbMovie.id],
//     }),
//   }),
// );

// export const tmdbMovieSpokenLanguagesRelations = relations(
//   tmdbMovieSpokenLanguages,
//   ({ one }) => ({
//     tmdbLanguage: one(tmdbLanguage, {
//       fields: [tmdbMovieSpokenLanguages.iso6391],
//       references: [tmdbLanguage.iso6391],
//     }),
//     tmdbMovie: one(tmdbMovie, {
//       fields: [tmdbMovieSpokenLanguages.movieId],
//       references: [tmdbMovie.id],
//     }),
//   }),
// );

// export const tmdbMovieExternalIdsRelations = relations(
//   tmdbMovieExternalIds,
//   ({ one }) => ({
//     tmdbMovie: one(tmdbMovie, {
//       fields: [tmdbMovieExternalIds.movieId],
//       references: [tmdbMovie.id],
//     }),
//   }),
// );

// export const tmdbMovieRolesRelations = relations(tmdbMovieRoles, ({ one }) => ({
//   tmdbMovieCredit: one(tmdbMovieCredits, {
//     fields: [tmdbMovieRoles.creditId],
//     references: [tmdbMovieCredits.id],
//   }),
// }));

// export const tmdbMovieVideosRelations = relations(
//   tmdbMovieVideos,
//   ({ one }) => ({
//     tmdbCountry: one(tmdbCountry, {
//       fields: [tmdbMovieVideos.iso31661],
//       references: [tmdbCountry.iso31661],
//     }),
//     tmdbMovie: one(tmdbMovie, {
//       fields: [tmdbMovieVideos.movieId],
//       references: [tmdbMovie.id],
//     }),
//   }),
// );

// export const tmdbMovieTranslationsRelations = relations(
//   tmdbMovieTranslations,
//   ({ one }) => ({
//     tmdbMovie: one(tmdbMovie, {
//       fields: [tmdbMovieTranslations.movieId],
//       references: [tmdbMovie.id],
//     }),
//   }),
// );

// export const tmdbMovieImagesRelations = relations(
//   tmdbMovieImages,
//   ({ one }) => ({
//     tmdbMovie: one(tmdbMovie, {
//       fields: [tmdbMovieImages.movieId],
//       references: [tmdbMovie.id],
//     }),
//   }),
// );

// export const tmdbMovieAlternativeTitlesRelations = relations(
//   tmdbMovieAlternativeTitles,
//   ({ one }) => ({
//     tmdbMovie: one(tmdbMovie, {
//       fields: [tmdbMovieAlternativeTitles.movieId],
//       references: [tmdbMovie.id],
//     }),
//   }),
// );

// export const usersInAuthRelations = relations(usersInAuth, ({ many }) => ({
//   users: many(user),
// }));

// export const supportedLanguagesInConfigRelations = relations(
//   supportedLanguagesInConfig,
//   ({ many }) => ({
//     users: many(user),
//   }),
// );

// export const userNotificationTokensRelations = relations(
//   userNotificationTokens,
//   ({ one }) => ({
//     user: one(user, {
//       fields: [userNotificationTokens.userId],
//       references: [user.id],
//     }),
//   }),
// );

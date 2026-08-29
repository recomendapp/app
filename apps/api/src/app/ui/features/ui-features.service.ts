import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { plainToInstance } from 'class-transformer';
import { assetPaths } from '@libs/assets';
import { SupportedLocale } from '@libs/i18n';
import { UiFeatureDto } from './ui-features.dto';

interface FeatureAssetPaths {
  default: string;
  mobile: string;
}

interface FeatureVideoAssetPaths extends FeatureAssetPaths {
  webm: string;
}

interface FeatureDefinition {
  key: string;
  video: FeatureVideoAssetPaths;
  poster: FeatureAssetPaths;
}

const FEATURES: FeatureDefinition[] = [
  {
    key: 'tracking',
    video: {
      default: assetPaths.welcome.features.tracking,
      mobile: assetPaths.welcome.features.trackingMobile,
      webm: assetPaths.welcome.features.trackingWebm,
    },
    poster: {
      default: assetPaths.welcome.features.trackingPoster,
      mobile: assetPaths.welcome.features.trackingPosterMobile,
    },
  },
  {
    key: 'recos',
    video: {
      default: assetPaths.welcome.features.recos,
      mobile: assetPaths.welcome.features.recosMobile,
      webm: assetPaths.welcome.features.recosWebm,
    },
    poster: {
      default: assetPaths.welcome.features.recosPoster,
      mobile: assetPaths.welcome.features.recosPosterMobile,
    },
  },
  {
    key: 'playlists',
    video: {
      default: assetPaths.welcome.features.playlists,
      mobile: assetPaths.welcome.features.playlistsMobile,
      webm: assetPaths.welcome.features.playlistsWebm,
    },
    poster: {
      default: assetPaths.welcome.features.playlistsPoster,
      mobile: assetPaths.welcome.features.playlistsPosterMobile,
    },
  },
  {
    key: 'feed',
    video: {
      default: assetPaths.welcome.features.feed,
      mobile: assetPaths.welcome.features.feedMobile,
      webm: assetPaths.welcome.features.feedWebm,
    },
    poster: {
      default: assetPaths.welcome.features.feedPoster,
      mobile: assetPaths.welcome.features.feedPosterMobile,
    },
  },
  {
    key: 'bookmarks',
    video: {
      default: assetPaths.welcome.features.bookmarks,
      mobile: assetPaths.welcome.features.bookmarksMobile,
      webm: assetPaths.welcome.features.bookmarksWebm,
    },
    poster: {
      default: assetPaths.welcome.features.bookmarksPoster,
      mobile: assetPaths.welcome.features.bookmarksPosterMobile,
    },
  },
];

@Injectable()
export class UiFeaturesService {
  constructor(private readonly i18n: I18nService) {}

  listAll(locale: SupportedLocale): UiFeatureDto[] {
    return FEATURES.map((feature) =>
      plainToInstance(UiFeatureDto, {
        key: feature.key,
        label: this.i18n.t(`features.${feature.key}.label`, { lang: locale }),
        description: this.i18n.t(`features.${feature.key}.description`, { lang: locale }),
        video: feature.video,
        poster: feature.poster,
      }),
    );
  }
}

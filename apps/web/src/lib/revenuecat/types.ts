export interface RevenueCatListResponse<T> {
  object: 'list';
  url: string;
  next_page: string | null;
  items: T[];
}

export interface RevenueCatOffering {
  object: 'offering';
  id: string;
  lookup_key: string;
  display_name: string;
  project_id: string;
  created_at: number;
  is_current: boolean;
  metadata: Record<string, unknown> | null;
  packages?: RevenueCatListResponse<RevenueCatPackage>;
}

export type RevenueCatOfferingsResponse =
  RevenueCatListResponse<RevenueCatOffering>;

export interface RevenueCatPackage {
  object: 'package';
  id: string;
  lookup_key: '$rc_monthly' | '$rc_annual' | string;
  display_name: string;
  position: number;
  created_at: number;
  products?: RevenueCatListResponse<RevenueCatPackageProduct>;
}

export type RevenueCatPackagesResponse =
  RevenueCatListResponse<RevenueCatPackage>;

export interface RevenueCatProduct {
  object: 'product';
  id: string;
  app_id: string;
  display_name: string;
  store_identifier: string;
  type: 'subscription' | 'one_time';
  created_at: number;

  subscription: {
    duration: string | null;
    trial_duration: string | null;
    grace_period_duration: string | null;
  } | null;

  one_time: {
    price: number;
    currency: string;
  } | null;
}

export interface RevenueCatPackageProduct {
  eligibility_criteria: 'all' | string;
  product: RevenueCatProduct;
}

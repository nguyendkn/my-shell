export type OAuthAccount = {
  uuid: string;
  email: string;
  display_name?: string | null;
  created_at?: string;
  [key: string]: unknown;
};

export type OAuthOrganization = {
  uuid: string;
  organization_type?: string;
  rate_limit_tier?: RateLimitTier | null;
  has_extra_usage_enabled?: boolean | null;
  billing_type?: BillingType | null;
  subscription_created_at?: string | null;
  [key: string]: unknown;
};

export type OAuthTokenAccount = {
  uuid: string;
  emailAddress: string;
  organizationUuid: string;
  [key: string]: unknown;
};

export type OAuthTokens = {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: number;
  scopes?: string[];
  profile?: OAuthProfileResponse;
  tokenAccount?: OAuthTokenAccount;
  [key: string]: unknown;
};

export type SubscriptionType = string;
export type BillingType = string;
export type OAuthProfileResponse = {
  account: OAuthAccount;
  organization: OAuthOrganization;
  [key: string]: unknown;
};
// Per-referral-code metadata returned alongside eligibility. Optional in
// external builds where the referral campaign endpoint may omit it.
export type ReferralCodeDetails = {
  referral_link?: string;
  campaign?: string;
  code?: string;
};

// Eligibility response from the referral campaign endpoint. The runtime
// feature gates check `eligible` before showing referral UI; v1 campaigns
// also surface remaining_passes and the per-referrer reward shape.
export type ReferralEligibilityResponse = {
  eligible: boolean;
  eligible_to_earn?: boolean;
  eligible_to_redeem?: boolean;
  remaining_passes?: number;
  referrer_reward?: ReferrerRewardInfo;
  referral_code_details?: ReferralCodeDetails;
};

// Single redemption record returned by the redemptions endpoint.
export type ReferralRedemption = {
  campaign?: string;
  redeemed_at?: string;
  reward?: ReferrerRewardInfo;
};

// Redemption tracking — array of redemptions plus the campaign limit
// (how many passes a referrer can hand out before the cap kicks in).
export type ReferralRedemptionsResponse = {
  redemptions?: readonly ReferralRedemption[];
  limit?: number;
  total_count?: number;
};

// Reward shape returned by the referrer-reward lookup. Currency code is
// the ISO-4217 alphabetic code; amount_minor_units is in cents/pence/etc
// (divide by 100 for the major-unit display value).
export type ReferrerRewardInfo = {
  amount?: number;
  amount_minor_units: number;
  currency: string;
  [key: string]: unknown;
};
// Response shape from the OAuth token exchange endpoint. Mirrors the
// upstream Anthropic OAuth API. Required fields are what formatTokens reads
// to build OAuthTokens; the index signature stays open so additional
// vendor-specific fields don't trip strict checks.
export type OAuthTokenExchangeResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  account?: { uuid: string; email_address: string };
  organization?: { uuid: string };
  [key: string]: unknown;
};
export type RateLimitTier = string;
// Response from the roles endpoint. organization_role / workspace_role are
// the role identifiers persisted alongside the OAuth account; organization_name
// is shown in the account display.
export type UserRolesResponse = {
  organization_role?: string;
  workspace_role?: string;
  organization_name?: string;
  [key: string]: unknown;
};
// Referral campaign identifier. The runtime currently only knows
// claude_code_guest_pass; left as a string so future campaigns don't
// require a type change.
export type ReferralCampaign = string;

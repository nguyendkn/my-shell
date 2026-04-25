export type StatusLineItem = Record<string, unknown>;

export type RateLimitWindow = {
  used_percentage: number;
  // Unix timestamp (seconds) for when the window resets, or ISO string for
  // older payload variants.
  resets_at?: number | string;
};

export type StatusLineRateLimits = {
  five_hour?: RateLimitWindow;
  seven_day?: RateLimitWindow;
};

export type StatusLineCommandInput = {
  rate_limits?: StatusLineRateLimits;
  [key: string]: unknown;
};

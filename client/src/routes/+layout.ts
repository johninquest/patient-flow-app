import posthog from 'posthog-js'
import { browser } from '$app/environment';

export const ssr = false;

export const load = async () => {
  if (browser) {
    posthog.init(
      'phc_Y1X2kpbv6lPYA8zmpr2RQuYR8NWmygpIZuuZXGKNkmj',
      {
        api_host: 'https://eu.i.posthog.com',
        person_profiles: 'identified_only',
      }
    )
  }

  return {};
};
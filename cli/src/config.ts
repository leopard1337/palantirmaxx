/**
 * CLI configuration. Uses env vars; no .env loading (user can dotenv-cli if needed).
 */
export const config = {
  /** Base URL of the Quantis app (for /api/intel/*, etc.). Default: https://quantis.gg */
  get apiBase(): string {
    return process.env.QUANTIS_API_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://quantis.gg';
  },

  /** Bearer token for Glint/Quantis API (feed, events, markets). Required for full data. */
  get bearer(): string | undefined {
    return (
      process.env.QUANTIS_BEARER ??
      process.env.GLINT_BEARER ??
      process.env.NEXT_PUBLIC_QUANTIS_BEARER
    );
  },

  /** Dry run: don't execute real trades */
  get dryRun(): boolean {
    return process.env.QUANTIS_DRY_RUN === '1' || process.env.QUANTIS_DRY_RUN === 'true';
  },
};

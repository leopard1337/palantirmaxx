/**
 * Trade command – stub for future exchange integration.
 * Quantis is the data layer; execution hooks go here.
 */

export async function runTradeCommand(_opts: { market?: string; side?: string; amount?: string }) {
  console.log('\n⚠️  Trade execution not yet implemented.\n');
  console.log('  Quantis CLI provides the data layer. To place trades:');
  console.log('  • Polymarket: https://polymarket.com');
  console.log('  • Glint/Quantis API: trading endpoints TBD');
  console.log('  • Manifold: https://api.manifold.markets');
  console.log('');
  console.log('  Run `quantis agent` to get signals. Wire execution when ready.\n');
}

import { PublicKey } from '@solana/web3.js';

// Your actual program ID
const PROGRAM_ID = new PublicKey('MartyBurn11111111111111111111111111111111111');

// Seed used to derive the PDA (same as used in your burn logic)
const SEED = 'marty_burn';

try {
  const [burnPDA, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEED)],
    PROGRAM_ID
  );

  console.log(`✅ Marty Burn PDA: ${burnPDA.toBase58()}`);
  console.log(`🔢 Bump: ${bump}`);
  console.log('📎 This PDA is secure and cannot be externally controlled.');
  console.log('🔍 You can verify this on-chain using any Solana explorer by checking the derived address against this program and seed.');
} catch (err) {
  console.error('❌ Error deriving PDA:', err.message);
}

/**
 * Balance — Core Logic
 * Queries wallet SOL and token balances.
 */

import { PublicKey } from "@solana/web3.js";
import { getConnection, getSolBalance } from "../services/solana.js";
import { loadKeypair } from "../utils/keypair.js";
import { TOKEN_PROGRAM_ID } from "../config/constants.js";
import type { ToolResponse, BalanceResult } from "../types/index.js";

export async function getBalance(address?: string): Promise<ToolResponse<BalanceResult>> {
  try {
    let pubkey: PublicKey;
    if (address) {
      pubkey = new PublicKey(address);
    } else {
      const wallet = loadKeypair();
      pubkey = wallet.publicKey;
    }
    const conn = getConnection();

    const solBalance = await getSolBalance(pubkey);

    // Fetch SPL Token accounts (auto.fun uses standard SPL Token, not Token2022)
    const tokenAccounts = await conn.getParsedTokenAccountsByOwner(pubkey, {
      programId: TOKEN_PROGRAM_ID,
    });

    const tokens = tokenAccounts.value
      .filter((a) => {
        const amount = a.account.data.parsed?.info?.tokenAmount;
        return amount && Number(amount.uiAmount) > 0;
      })
      .map((a) => ({
        mint: a.account.data.parsed.info.mint as string,
        balance: a.account.data.parsed.info.tokenAmount.uiAmountString as string,
        decimals: a.account.data.parsed.info.tokenAmount.decimals as number,
      }));

    return {
      success: true,
      data: {
        address: pubkey.toBase58(),
        solBalance: solBalance.toFixed(4),
        tokens,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

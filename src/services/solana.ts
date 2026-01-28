/**
 * Solana Service
 * Connection management, balance queries, and transaction helpers.
 */

import {
  Connection,
  PublicKey,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAccount,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import {
  RPC_ENDPOINTS,
  LAMPORTS_PER_SOL,
  TOKEN_PROGRAM_ID,
} from "../config/constants.js";
import type { NetworkName } from "../config/constants.js";

// =============================================================================
// Connection Management
// =============================================================================

let connection: Connection | null = null;

export function getConnection(): Connection {
  if (connection) {
    return connection;
  }

  const rpcUrl =
    process.env.HELIUS_RPC_URL ||
    process.env.RPC_URL ||
    RPC_ENDPOINTS[getNetwork()];

  connection = new Connection(rpcUrl, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60000,
  });

  return connection;
}

export function getNetwork(): NetworkName {
  const network = process.env.SOLANA_NETWORK || "mainnet-beta";
  if (network in RPC_ENDPOINTS) {
    return network as NetworkName;
  }
  return "mainnet-beta";
}

export function isMainnet(): boolean {
  return getNetwork() === "mainnet-beta";
}

// =============================================================================
// Balance Queries
// =============================================================================

export async function getSolBalance(address: PublicKey): Promise<number> {
  const conn = getConnection();
  const balance = await conn.getBalance(address);
  return balance / LAMPORTS_PER_SOL;
}

export async function getTokenBalance(
  owner: PublicKey,
  mint: PublicKey
): Promise<{ balance: number; balanceRaw: bigint; decimals: number } | null> {
  const conn = getConnection();

  try {
    const ata = await getAssociatedTokenAddress(mint, owner, false, TOKEN_PROGRAM_ID);
    const account = await getAccount(conn, ata, "confirmed", TOKEN_PROGRAM_ID);

    const mintInfo = await conn.getParsedAccountInfo(mint);
    const decimals =
      (mintInfo.value?.data as Record<string, unknown> & { parsed?: { info?: { decimals?: number } } })
        ?.parsed?.info?.decimals || 6;

    const balanceRaw = account.amount;
    const balance = Number(balanceRaw) / Math.pow(10, decimals);

    return { balance, balanceRaw, decimals };
  } catch (error) {
    if (error instanceof TokenAccountNotFoundError) {
      return null;
    }
    throw error;
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

export function lamportsToSol(lamports: bigint | number): number {
  return Number(lamports) / LAMPORTS_PER_SOL;
}

export function getExplorerUrl(
  signatureOrAddress: string,
  type: "tx" | "address" = "tx"
): string {
  const network = getNetwork();
  const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`;

  if (type === "tx") {
    return `https://solscan.io/tx/${signatureOrAddress}${cluster}`;
  }
  return `https://solscan.io/account/${signatureOrAddress}${cluster}`;
}

export function getAutofunUrl(mintAddress: string): string {
  return `https://auto.fun/token/${mintAddress}`;
}

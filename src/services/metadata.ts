/**
 * Metadata Service
 * Generates Metaplex-standard JSON and uploads to Pinata IPFS.
 * Uses Node 18+ built-in fetch — no additional dependencies.
 */

const PINATA_API = "https://api.pinata.cloud";

export interface MetaplexJson {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url: string;
  properties: {
    category: string;
  };
}

/**
 * Generate a Metaplex-standard metadata JSON object.
 */
export function generateMetaplexJson(
  name: string,
  symbol: string,
  description?: string,
  image?: string
): MetaplexJson {
  return {
    name,
    symbol,
    description: description || "",
    image: image || "",
    external_url: "https://auto.fun",
    properties: {
      category: "meme",
    },
  };
}

/**
 * Upload metadata JSON to Pinata IPFS.
 * Requires PINATA_JWT environment variable.
 * Returns the IPFS gateway URL.
 */
export async function uploadMetadataToIPFS(metadata: MetaplexJson): Promise<string> {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error(
      "PINATA_JWT not set. Get a free API key at https://pinata.cloud and add it to .env"
    );
  }

  const res = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `${metadata.symbol}-metadata`,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Pinata upload failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { IpfsHash: string };
  return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
}

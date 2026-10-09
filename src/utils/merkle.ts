/**
 * Merkle tree utilities for governance voting
 *
 * Generates merkle roots and proofs for voter address lists
 * Compatible with Soroban merkle voting contracts
 */

import crypto from 'crypto';
import { Address } from '@stellar/stellar-sdk';

/**
 * Leaf data for merkle tree
 */
export interface VoterLeaf {
  address: string;
  weight?: number; // Optional voting weight
}

/**
 * Merkle tree result
 */
export interface MerkleTreeResult {
  root: string; // 32-byte hex string
  leaves: VoterLeaf[];
  proofs: Map<string, string[]>; // address -> proof path
}

/**
 * Hash a single leaf
 */
function hashLeaf(leaf: VoterLeaf): Buffer {
  const data = `${leaf.address}:${leaf.weight || 1}`;
  return crypto.createHash('sha256').update(data).digest();
}

/**
 * Hash two nodes together
 */
function hashPair(left: Buffer, right: Buffer): Buffer {
  // Sort to ensure consistent ordering
  const [a, b] = left.compare(right) < 0 ? [left, right] : [right, left];
  return crypto.createHash('sha256').update(Buffer.concat([a, b])).digest();
}

/**
 * Build merkle tree from voter list
 * @param voters - List of voter addresses with optional weights
 * @returns Merkle tree with root and proofs
 */
export function buildMerkleTree(voters: VoterLeaf[]): MerkleTreeResult {
  if (voters.length === 0) {
    throw new Error('Voter list cannot be empty');
  }

  // Validate all addresses
  for (const voter of voters) {
    try {
      Address.fromString(voter.address);
    } catch (error) {
      throw new Error(`Invalid Stellar address: ${voter.address}`);
    }
  }

  // Hash all leaves
  const leaves = voters.map((v) => hashLeaf(v));
  let currentLevel = [...leaves];
  const tree: Buffer[][] = [leaves];

  // Build tree bottom-up
  while (currentLevel.length > 1) {
    const nextLevel: Buffer[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        // Pair exists
        nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]));
      } else {
        // Odd number - duplicate last node
        nextLevel.push(hashPair(currentLevel[i], currentLevel[i]));
      }
    }

    tree.push(nextLevel);
    currentLevel = nextLevel;
  }

  const root = tree[tree.length - 1][0].toString('hex');

  // Generate proofs for each leaf
  const proofs = new Map<string, string[]>();
  for (let i = 0; i < voters.length; i++) {
    const proof = generateProof(tree, i);
    proofs.set(voters[i].address, proof);
  }

  return {
    root,
    leaves: voters,
    proofs,
  };
}

/**
 * Generate proof path for a specific leaf index
 */
function generateProof(tree: Buffer[][], leafIndex: number): string[] {
  const proof: string[] = [];
  let index = leafIndex;

  for (let level = 0; level < tree.length - 1; level++) {
    const isRightNode = index % 2 === 1;
    const siblingIndex = isRightNode ? index - 1 : index + 1;

    if (siblingIndex < tree[level].length) {
      proof.push(tree[level][siblingIndex].toString('hex'));
    }

    index = Math.floor(index / 2);
  }

  return proof;
}

/**
 * Create merkle root from simple address list
 * Convenience function for equal-weight voting
 * @param addresses - Array of Stellar addresses
 * @returns Merkle root as 32-byte hex string
 */
export function createMerkleRootFromAddresses(addresses: string[]): string {
  const voters = addresses.map((address) => ({ address, weight: 1 }));
  return buildMerkleTree(voters).root;
}


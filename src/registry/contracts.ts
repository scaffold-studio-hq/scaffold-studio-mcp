/**
 * Contract address registry
 *
 * Maps contract names to their deployed addresses on each network.
 * Addresses are from CONTRACT_REGISTRY.md
 */

import type { Network } from '../core/types.js';

/**
 * Stellar Registry Contract Addresses
 * The registry contract is deployed at different addresses for each network
 */
export const REGISTRY_CONTRACT: Record<Network, string> = {
  local: '', // Registry not typically deployed on local
  testnet: 'CBCOGWBDGBFWR5LQFKRQUPFIG6OLOON35PBKUPB6C542DFZI3OMBOGHX',
  mainnet: 'CC3SILHAJ5O75KMSJ5J6I5HV753OTPWEVMZUYHS4QEM2ZTISQRAOMMF4',
};

/**
 * Contract types
 */
export type ContractName =
  | 'master_factory'
  | 'token_factory'
  | 'nft_factory'
  | 'governance_factory'
  | 'fungible_allowlist_example'
  | 'fungible_blocklist_example'
  | 'fungible_capped_example'
  | 'fungible_pausable_example'
  | 'fungible_vault_example'
  | 'nft_enumerable_example'
  | 'nft_royalties_example'
  | 'nft_access_control_example';

/**
 * Contract addresses by network
 */
export const CONTRACTS: Record<Network, Partial<Record<ContractName, string>>> = {
  local: {
    // Factory Contracts (Simplified - removed reentrancy guards, rate limiting, salt tracking)
    master_factory: 'CCNVPWKVKVLNPYWXBEMH4QEQ6HMVSOJBQ3GGHW55L6IJY4EXGQCXYTBU',
    token_factory: 'CCAX3IFONMYLL3RJA3MFUGG4NPRL2AE376TJFTBG6XUL64H6QMR3UJGM',
    nft_factory: 'CAJ75GRCGSRZXNFQFFIQNLS22STHMQESOT4LDAUVASIMHE4HJXS7UEYY',
    governance_factory: 'CBUXBYLAQRUPGGYAZCIBC2B7X3G4RNRG2DFIHNW3UWVPGK2EO7ZWTNWB',

    // Token Examples
    fungible_allowlist_example: 'CD3T7H6J7YBR7RDQ2I6C66USFLWVERZQHH5J7XVQ77SBDMFDZ5ZMSNU6',
    fungible_blocklist_example: 'CAPRZECSJPUSUY5NUM2H2CGBGACH3FG2KJHSCFGXUUTOAAEZO7IGB7FP',
    fungible_capped_example: 'CDHXNE3NPERFCXR6T4I7DQQ2T5TZ6O6W3DWECY3KUHNF7N2RKHYFWV7O',
    fungible_pausable_example: 'CD2R2DMIA5GXO2QE7T4IEYFDM6PPCDWCPXJ6MCTO3PVEQVF6PVQBW4DS',
    fungible_vault_example: 'CAGF5ABGRUVRHKY5WT3UKFI6T4CXIT5YO6NDDGIJSZKW2H4BZ2DILYEY',

    // NFT Examples
    nft_enumerable_example: 'CC7COMIKYOU3WCP5A5UXB7PQ3GXAOXCXDGF4DSTBMSK7JZRHSG75SI7H',
    nft_royalties_example: 'CA524NON3UA6FTERQ3OPIUTHRTXZUHDLDE3ZF5F2P5FUR2DPHRVTARXX',
    nft_access_control_example: 'CDW75LY7CYKBKVQHKQD7KLGO7VKJPOJEOVWVWAP5OQAF42VWXNON7KDT',
  },
  testnet: {
    // Factory Contracts (Simplified - removed reentrancy guards, rate limiting, salt tracking)
    // Updated Nov 10, 2025 - NFT Factory with custom metadata support
    master_factory: 'CCQM52Z3ANW6TGJQMAS7GK5SD5U4ZHZKHAA6BXBFVRMYDDCASOAC3N3G',
    token_factory: 'CAHLJEQUCNTV7JPAPCMLCBIHOX7FFB57DUARJ6XGTW27FPCVKKY7JM2A',
    nft_factory: 'CB47RPH7MM662KJ3ZJLPEP4PVJIFUL4NQKKYNWZQ3J773MQUJYU33GCZ', // ✅ Updated with metadata support
    governance_factory: 'CC3SLHSCJHP7YJ462ZIACJ54VOHL5ZFUODZKBTITIZSO74D4YOPR5WCE',
  },
  mainnet: {
    // To be deployed
  },
};

/**
 * Get contract address by name and network
 */
export function getContractAddress(
  contractName: ContractName,
  network: Network
): string {
  const address = CONTRACTS[network][contractName];
  if (!address) {
    throw new Error(
      `Contract ${contractName} not deployed on ${network} network`
    );
  }
  return address;
}

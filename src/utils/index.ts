/**
 * Stellar Studio Utilities
 *
 * Comprehensive helper functions for contract deployment and interaction
 */

// Salt utilities
export {
  generateSalt,
  generateMultipleSalts,
} from './salt.js';

// Merkle tree utilities
export {
  buildMerkleTree,
  createMerkleRootFromAddresses,
  type VoterLeaf,
  type MerkleTreeResult,
} from './merkle.js';

// Validation utilities
export {
  isValidAddress,
  isValidTokenName,
  isValidTokenSymbol,
  isValidDecimals,
  isValidAmount,
  isValidSalt,
  isValidCap,
  validateTokenConfig,
  validateGovernanceConfig,
  type ValidationResult,
} from './validation.js';

// Config builders
export {
  buildTokenConfig,
  buildNFTConfig,
  buildGovernanceConfig,
  buildCappedTokenConfig,
  buildSimpleTokenConfig,
  buildEnumerableNFTConfig,
  buildMerkleVotingConfig,
  formatTokenAmount,
  parseTokenAmount,
  type TokenType,
  type NFTType,
  type GovernanceType,
  type TokenConfigParams,
  type NFTConfigParams,
  type GovernanceConfigParams,
} from './builders.js';

// Command executor utilities
export {
  executeCommand,
  executeCommandSimple,
  isCommandAvailable,
  isStellarCLIAvailable,
  isStellarRegistryAvailable,
  type ExecuteOptions,
  type ExecuteResult,
} from './executor.js';

// Serialization utilities
export {
  serializeBigInt,
} from './serialization.js';

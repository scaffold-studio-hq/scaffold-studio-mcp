/**
 * Governance service with @Tool decorated methods
 */
import { Tool } from "../../core/Tool.decorator.js";
import type { StellarClient, ToolResult } from "../../core/index.js";
import { GovernanceFactoryClient, type GovernanceConfig, type GovernanceType } from "../../clients/index.js";
import type { DeployGovernanceParams, GetGovernanceByTypeParams, GetGovernanceByAdminParams } from "./parameters.js";
import { some, none } from "../../core/Option.js";
import { serializeBigInt } from "../../utils/serialization.js";
import { withToolError } from "../../utils/errors.js";
import { randomBytes } from "crypto";

export class GovernanceService {
  /**
   * Deploy a new governance contract
   */
  @Tool({
    name: "governance_deploy",
    description: "Deploy a new MerkleVoting governance contract via GovernanceFactory",
  })
  async deployGovernance(
    stellarClient: StellarClient,
    params: DeployGovernanceParams
  ): Promise<ToolResult<string>> {
    return withToolError("Failed to deploy governance", async () => {
      const governanceFactory = new GovernanceFactoryClient(stellarClient);
      const salt = params.salt ? Buffer.from(params.salt, "hex") : randomBytes(32);

      // Only MerkleVoting is supported
      if (params.governance_type !== "MerkleVoting") {
        throw new Error("Only MerkleVoting governance is supported");
      }

      // Validate root_hash required for MerkleVoting
      if (!params.root_hash) {
        throw new Error("MerkleVoting governance requires a root_hash");
      }

      // Map governance type to enum
      const governanceType: GovernanceType = {
        tag: "MerkleVoting" as any,
        values: undefined as any,
      };

      // MerkleVoting configuration
      const rootHashBuffer = Buffer.from(params.root_hash, "hex");
      const ownersOption = params.owners && params.owners.length > 0 ? some(params.owners) : none<Array<string>>();
      const thresholdOption = typeof params.threshold === "number" ? some(params.threshold) : none<number>();

      const config: GovernanceConfig = {
        admin: params.admin,
        governance_type: governanceType,
        owners: ownersOption,
        threshold: thresholdOption,
        root_hash: some(rootHashBuffer),
        salt,
      } as GovernanceConfig;

      const assembled = await governanceFactory.deployGovernance(
        stellarClient.getAddress(),
        config
      );

      const { result } = await assembled.signAndSend();
      const governanceAddress = result as string;

      return {
        success: true,
        data: governanceAddress,
        suggestion: `${params.governance_type} governance deployed at ${governanceAddress}`,
      };
    });
  }

  /**
   * Get all deployed governance contracts
   */
  @Tool({
    name: "governance_get_deployed",
    description: "Get list of all deployed governance contracts",
  })
  async getDeployedGovernance(stellarClient: StellarClient): Promise<ToolResult> {
    return withToolError("Failed to get deployed governance", async () => {
      const governanceFactory = new GovernanceFactoryClient(stellarClient);
      const assembled = await governanceFactory.getDeployedGovernance();
      const simulation = await assembled.simulate();
      const governance = simulation.result;

      // Serialize BigInt values before returning
      const serializedGovernance = serializeBigInt(governance);

      return {
        success: true,
        data: serializedGovernance,
        suggestion: `Found ${governance.length} governance contracts`,
      };
    });
  }

  /**
   * Get governance by type
   */
  @Tool({
    name: "governance_get_by_type",
    description: "Get governance contracts filtered by type (only MerkleVoting is supported)",
  })
  async getGovernanceByType(
    stellarClient: StellarClient,
    params: GetGovernanceByTypeParams
  ): Promise<ToolResult> {
    return withToolError("Failed to get governance by type", async () => {
      const governanceFactory = new GovernanceFactoryClient(stellarClient);
      const governanceType: GovernanceType = {
        tag: params.governance_type as any,
        values: undefined as any,
      };

      const assembled = await governanceFactory.getGovernanceByType(governanceType);
      const simulation = await assembled.simulate();
      const governance = simulation.result;

      // Serialize BigInt values before returning
      const serializedGovernance = serializeBigInt(governance);

      return {
        success: true,
        data: serializedGovernance,
        suggestion: `Found ${governance.length} ${params.governance_type} governance contracts`,
      };
    });
  }

  /**
   * Get governance by admin
   */
  @Tool({
    name: "governance_get_by_admin",
    description: "Get governance contracts filtered by admin address",
  })
  async getGovernanceByAdmin(
    stellarClient: StellarClient,
    params: GetGovernanceByAdminParams
  ): Promise<ToolResult> {
    return withToolError("Failed to get governance by admin", async () => {
      const governanceFactory = new GovernanceFactoryClient(stellarClient);
      const assembled = await governanceFactory.getGovernanceByAdmin(params.admin);
      const simulation = await assembled.simulate();
      const governance = simulation.result;

      // Serialize BigInt values before returning
      const serializedGovernance = serializeBigInt(governance);

      return {
        success: true,
        data: serializedGovernance,
        suggestion: `Found ${governance.length} governance contracts managed by ${params.admin}`,
      };
    });
  }

  /**
   * Get governance count
   */
  @Tool({
    name: "governance_get_count",
    description: "Get total number of deployed governance contracts",
  })
  async getGovernanceCount(stellarClient: StellarClient): Promise<ToolResult<number>> {
    return withToolError("Failed to get governance count", async () => {
      const governanceFactory = new GovernanceFactoryClient(stellarClient);
      const assembled = await governanceFactory.getGovernanceCount();
      const simulation = await assembled.simulate();
      const count = simulation.result;

      return {
        success: true,
        data: count,
        suggestion: `Total governance contracts: ${count}`,
      };
    });
  }
}

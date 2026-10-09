/**
 * Registry Service - Stellar Registry CLI Integration
 */
import { Tool } from '../../core/Tool.decorator.js';
import type { StellarClient, ToolResult } from '../../core/index.js';
import type * as P from './parameters.js';
import { parseConstructorArgs } from './constructor-args.js';
import { REGISTRY_CONTRACT } from '../../registry/contracts.js';
import {
  executeCommandSimple,
  isStellarCLIAvailable,
  isStellarRegistryAvailable,
} from '../../utils/executor.js';

export class RegistryService {
  /**
   * Check if stellar CLI is available
   */
  private checkStellarCLI(): { available: boolean; error?: string } {
    if (!isStellarCLIAvailable()) {
      return {
        available: false,
        error:
          'Stellar CLI not found. Please install it first:\n\n' +
          'macOS: brew install stellar-cli\n' +
          'Linux: curl --proto \'=https\' --tlsv1.2 -sSf https://sh.stellar.org | sh\n' +
          'Windows: winget install --id Stellar.StellarCLI --source winget\n' +
          'Or: cargo install --locked stellar-cli --features opt',
      };
    }
    return { available: true };
  }

  /**
   * Check if stellar registry CLI is available
   */
  private checkRegistryCLI(): { available: boolean; error?: string } {
    const stellarCheck = this.checkStellarCLI();
    if (!stellarCheck.available) {
      return stellarCheck;
    }

    if (!isStellarRegistryAvailable()) {
      return {
        available: false,
        error:
          'Stellar Registry CLI subcommand not found. Install it with:\n\n' +
          'cargo install --git https://github.com/theahaco/scaffold-stellar stellar-registry-cli',
      };
    }
    return { available: true };
  }

  @Tool({
    name: 'registry_publish',
    description:
      'Publish a compiled contract to the Stellar Registry. This makes the contract ' +
      'available for deployment. The registry tracks versions and metadata for published contracts.',
  })
  async publish(sc: StellarClient, p: P.PublishParams): Promise<ToolResult<{ published: boolean; output: string }>> {
    try {
      // Check if registry CLI is available
      const cliCheck = this.checkRegistryCLI();
      if (!cliCheck.available) {
        return { success: false, error: cliCheck.error };
      }

      const args = ['registry', 'publish', '--wasm', p.wasm_path];

      if (p.wasm_name) {
        args.push('--wasm-name', p.wasm_name);
      }

      if (p.version) {
        args.push('--binver', p.version);
      }

      if (p.author) {
        args.push('--author', p.author);
      }

      if (p.dry_run) {
        args.push('--dry-run');
      }

      // Execute the command
      const output = executeCommandSimple('stellar', args, {
        cwd: p.working_directory,
        timeout: 60000,
      });

      return {
        success: true,
        data: {
          published: !p.dry_run,
          output: output.trim(),
        },
        suggestion: p.dry_run
          ? 'Dry run successful. Remove --dry-run to publish for real.'
          : `Contract published! Deploy with: registry_deploy`,
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  @Tool({
    name: 'registry_deploy',
    description:
      'Deploy a published contract from the Stellar Registry with optional initialization. ' +
      'This creates a new instance of a previously published contract. You can specify ' +
      'constructor function and arguments for initialization.',
  })
  async deploy(
    sc: StellarClient,
    p: P.DeployParams
  ): Promise<ToolResult<{ contract_id: string | null; output: string }>> {
    try {
      // Check if registry CLI is available
      const cliCheck = this.checkRegistryCLI();
      if (!cliCheck.available) {
        return { success: false, error: cliCheck.error };
      }

      const args = [
        'registry',
        'deploy',
        '--contract-name',
        p.contract_name,
        '--wasm-name',
        p.wasm_name,
      ];

      if (p.version) {
        args.push('--version', p.version);
      }

      // Add constructor function and arguments if provided
      if (p.constructor_function || p.constructor_args) {
        args.push('--');

        if (p.constructor_function) {
          args.push(p.constructor_function);
        }

        if (p.constructor_args) {
          args.push(...parseConstructorArgs(p.constructor_args));
        }
      }

      // Execute the command
      const output = executeCommandSimple('stellar', args, {
        cwd: p.working_directory,
        timeout: 60000,
      });

      // Try to extract contract ID from output (format: C[A-Z0-9]{55})
      const contractIdMatch = output.match(/C[A-Z0-9]{55}/);
      const contractId = contractIdMatch ? contractIdMatch[0] : null;

      return {
        success: true,
        data: {
          contract_id: contractId,
          output: output.trim(),
        },
        suggestion: `Contract deployed! Create alias with: registry_create_alias({ contract_name: "${p.contract_name}" })`,
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  @Tool({
    name: 'registry_create_alias',
    description:
      'Install a deployed contract as an alias to be used by stellar-cli. ' +
      'This allows you to interact with the contract using its name instead of its ID.',
  })
  async createAlias(sc: StellarClient, p: P.CreateAliasParams): Promise<ToolResult<{ alias_created: boolean; output: string }>> {
    try {
      // Check if registry CLI is available
      const cliCheck = this.checkRegistryCLI();
      if (!cliCheck.available) {
        return { success: false, error: cliCheck.error };
      }

      // Build the create-alias command
      const args = ['registry', 'create-alias', p.contract_name];

      // Execute the command
      const output = executeCommandSimple('stellar', args, {
        cwd: p.working_directory,
        timeout: 60000,
      });

      return {
        success: true,
        data: {
          alias_created: true,
          output: output.trim(),
        },
        suggestion: `Alias created! Use with: stellar contract invoke --id ${p.contract_name} -- --help`,
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  @Tool({
    name: 'registry_list_published',
    description:
      'List all published contracts in the Stellar Registry. Note: The registry contract does not support listing all published contracts directly. Use fetch_hash or current_version for specific contracts.',
  })
  async listPublished(sc: StellarClient, p: P.ListPublishedParams): Promise<ToolResult<any>> {
    try {
      return {
        success: false,
        error:
          'The registry contract does not support listing all published contracts. ' +
          'Use registry_get_versions or registry_info with a specific wasm_name to query individual contracts. ' +
          'The registry contract functions available are: publish, deploy, fetch_hash, current_version, fetch_contract_id',
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  @Tool({
    name: 'registry_get_versions',
    description:
      'Get the current version for a specific contract in the Stellar Registry. Returns the most recent version.',
  })
  async getVersions(sc: StellarClient, p: P.GetVersionsParams): Promise<ToolResult<string[]>> {
    try {
      const network = sc.getNetwork();
      // Default to testnet if registry not available on current network (e.g., local)
      const registryAddress = REGISTRY_CONTRACT[network.name] || REGISTRY_CONTRACT['testnet'];
      const registryNetwork = REGISTRY_CONTRACT[network.name] ? network.name : 'testnet';

      if (!registryAddress) {
        return {
          success: false,
          error: `Registry contract not available`,
        };
      }

      // Check if stellar CLI is available
      const cliCheck = this.checkStellarCLI();
      if (!cliCheck.available) {
        return { success: false, error: cliCheck.error };
      }

      // Use stellar CLI to query the registry contract - use current_version function
      const args = [
        'contract', 'invoke', '--id', registryAddress, '--source-account',
        sc.getAddress(), '--network', registryNetwork, '--', 'current_version',
        '--wasm_name', p.wasm_name,
      ];
      const output = executeCommandSimple('stellar', args, { timeout: 30000 });

      // Parse the output (JSON format from stellar CLI)
      const version = JSON.parse(output);

      return {
        success: true,
        data: version ? [version] : [],
        suggestion: `Current version for ${p.wasm_name} on ${registryNetwork}: ${version || 'not published'}`,
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  @Tool({
    name: 'registry_info',
    description:
      'Get information for a specific published contract in the Stellar Registry. Returns current version and hash.',
  })
  async getInfo(sc: StellarClient, p: P.GetInfoParams): Promise<ToolResult<any>> {
    try {
      const network = sc.getNetwork();
      // Default to testnet if registry not available on current network (e.g., local)
      const registryAddress = REGISTRY_CONTRACT[network.name] || REGISTRY_CONTRACT['testnet'];
      const registryNetwork = REGISTRY_CONTRACT[network.name] ? network.name : 'testnet';

      if (!registryAddress) {
        return {
          success: false,
          error: `Registry contract not available`,
        };
      }

      // Check if stellar CLI is available
      const cliCheck = this.checkStellarCLI();
      if (!cliCheck.available) {
        return { success: false, error: cliCheck.error };
      }

      // Get current version
      const versionArgs = [
        'contract', 'invoke', '--id', registryAddress, '--source-account',
        sc.getAddress(), '--network', registryNetwork, '--', 'current_version',
        '--wasm_name', p.wasm_name,
      ];
      let version: any = null;
      try {
        const versionOutput = executeCommandSimple('stellar', versionArgs, { timeout: 30000 });
        version = JSON.parse(versionOutput);
      } catch (e) {
        // Contract not published
      }

      // Get hash if version is specified or we have a current version
      const targetVersion = p.version || version;
      let hash: any = null;
      if (targetVersion) {
        try {
          const hashArgs = [
            'contract', 'invoke', '--id', registryAddress, '--source-account',
            sc.getAddress(), '--network', registryNetwork, '--', 'fetch_hash',
            '--wasm_name', p.wasm_name, '--version', targetVersion,
          ];
          const hashOutput = executeCommandSimple('stellar', hashArgs, { timeout: 30000 });
          hash = JSON.parse(hashOutput);
        } catch (e) {
          // Hash not found
        }
      } else {
        // Try without version to get latest
        try {
          const hashArgs = [
            'contract', 'invoke', '--id', registryAddress, '--source-account',
            sc.getAddress(), '--network', registryNetwork, '--', 'fetch_hash',
            '--wasm_name', p.wasm_name,
          ];
          const hashOutput = executeCommandSimple('stellar', hashArgs, { timeout: 30000 });
          hash = JSON.parse(hashOutput);
        } catch (e) {
          // Hash not found
        }
      }

      const info = {
        wasm_name: p.wasm_name,
        current_version: version,
        hash: hash,
        network: registryNetwork,
      };

      return {
        success: true,
        data: info,
        suggestion: `Retrieved info for ${p.wasm_name}${version ? ` (current version: ${version})` : ' (not published)'} from ${registryNetwork}`,
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

/**
 * Registry Plugin Parameters
 */
import { z } from 'zod';

// Publish parameters
export const PublishSchema = z.object({
  wasm_path: z.string().describe('Path to the compiled WASM file to publish'),
  wasm_name: z
    .string()
    .optional()
    .describe('Name for the published contract (optional, extracted from metadata if not provided)'),
  version: z
    .string()
    .optional()
    .describe('Binary version (optional, extracted from metadata if not provided)'),
  author: z
    .string()
    .optional()
    .describe('Author address (optional, defaults to configured source account)'),
  dry_run: z
    .boolean()
    .default(false)
    .describe('Simulate the publish operation without executing it'),
  working_directory: z
    .string()
    .optional()
    .describe('Working directory to execute command from (default: current directory)'),
});

export type PublishParams = z.infer<typeof PublishSchema>;

// Deploy parameters
export const DeploySchema = z.object({
  contract_name: z.string().describe('The name to give this contract instance'),
  wasm_name: z.string().describe('The name of the previously published contract to deploy'),
  version: z
    .string()
    .optional()
    .describe('Specific version to deploy (optional, defaults to most recent)'),
  constructor_function: z
    .string()
    .optional()
    .describe('Optional constructor function name if contract needs initialization'),
  constructor_args: z
    .string()
    .optional()
    .describe(
      'Arguments for the constructor function (space-separated argv tokens; quote values with spaces, e.g. --name "Token Name" --symbol TKN). Quotes group a token; shell syntax is not evaluated.'
    ),
  working_directory: z
    .string()
    .optional()
    .describe('Working directory to execute command from (default: current directory)'),
});

export type DeployParams = z.infer<typeof DeploySchema>;

// Create alias parameters
export const CreateAliasSchema = z.object({
  contract_name: z.string().describe('Name of the deployed contract to create an alias for'),
  working_directory: z
    .string()
    .optional()
    .describe('Working directory to execute command from (default: current directory)'),
});

export type CreateAliasParams = z.infer<typeof CreateAliasSchema>;

// List published parameters
export const ListPublishedSchema = z.object({
  // No parameters needed - lists all published contracts
});

export type ListPublishedParams = z.infer<typeof ListPublishedSchema>;

// Get versions parameters
export const GetVersionsSchema = z.object({
  wasm_name: z.string().describe('Name of the published contract to get versions for'),
});

export type GetVersionsParams = z.infer<typeof GetVersionsSchema>;

// Get info parameters
export const GetInfoSchema = z.object({
  wasm_name: z.string().describe('Name of the published contract to get info for'),
  version: z
    .string()
    .optional()
    .describe('Specific version to get info for (optional, defaults to latest)'),
});

export type GetInfoParams = z.infer<typeof GetInfoSchema>;

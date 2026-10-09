/**
 * Command Executor Utility
 *
 * Handles cross-platform command execution with proper error handling
 * and PATH management for Stellar CLI tools
 */

import { execFileSync } from 'child_process';
import { platform } from 'os';

export interface ExecuteOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  encoding?: BufferEncoding;
}

export interface ExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Ensure common tool paths are in PATH
 */
function ensureToolPaths(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const enhancedEnv = { ...env };

  // Ensure cargo bin is in PATH
  if (!enhancedEnv.PATH?.includes('.cargo/bin')) {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (homeDir) {
      const separator = platform() === 'win32' ? ';' : ':';
      const cargoBinPath =
        platform() === 'win32'
          ? `${homeDir}\\.cargo\\bin`
          : `${homeDir}/.cargo/bin`;
      enhancedEnv.PATH = `${cargoBinPath}${separator}${enhancedEnv.PATH || ''}`;
    }
  }

  return enhancedEnv;
}

/**
 * Execute a program with an argv array; arguments are never interpreted by a shell.
 */
export function executeCommand(
  executable: string,
  args: string[] = [],
  options: ExecuteOptions = {},
): ExecuteResult {
  try {
    const env = ensureToolPaths({
      ...process.env,
      ...options.env,
    });

    const output = execFileSync(executable, args, {
      shell: false,
      cwd: options.cwd || process.cwd(),
      env,
      encoding: options.encoding || 'utf-8',
      stdio: 'pipe',
      timeout: options.timeout || 60000, // 60 second default
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    return {
      stdout: output.toString(),
      stderr: '',
      exitCode: 0,
    };
  } catch (error: any) {
    // Extract error details
    const stderr = error.stderr?.toString() || '';
    const stdout = error.stdout?.toString() || '';
    const exitCode = error.status || error.code || 1;

    // Try to extract meaningful error message
    let errorMessage =
      stderr || stdout || error.message || 'Command execution failed';

    // Clean up common error patterns
    if (
      errorMessage.includes('command not found') ||
      errorMessage.includes('not found')
    ) {
      const commandName = executable;
      errorMessage = `Command '${commandName}' not found. Please install it first. + ${exitCode}`;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Execute a command and return only stdout
 */
export function executeCommandSimple(
  executable: string,
  args: string[] = [],
  options: ExecuteOptions = {},
): string {
  const result = executeCommand(executable, args, options);
  return result.stdout.trim();
}

/**
 * Check if a command is available
 * Uses 'which' on Unix and 'where' on Windows
 */
export function isCommandAvailable(command: string): boolean {
  const detector = platform() === 'win32' ? 'where' : 'which';

  try {
    executeCommand(detector, [command], { timeout: 5000 });
    return true;
  } catch {
    // Try executing the command with --version as fallback
    try {
      executeCommand(command, ['--version'], { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Check if stellar CLI is available
 */
export function isStellarCLIAvailable(): boolean {
  return isCommandAvailable('stellar');
}

/**
 * Check if stellar registry subcommand is available
 */
export function isStellarRegistryAvailable(): boolean {
  try {
    executeCommand('stellar', ['registry', '--help'], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

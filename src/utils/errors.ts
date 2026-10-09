/**
 * Tool error handling utilities
 *
 * Provides structured error capturing and normalization for MCP tool executions.
 */

import type { ToolResult } from "../core/types.js";

/**
 * Execute an async tool action and map any caught errors into a standard ToolResult failure.
 * Narrows caught error from `unknown` safely without using `any`.
 *
 * @param fallbackMessage - Fallback error string if error has no message
 * @param fn - Async function executing the tool logic
 * @returns ToolResult with success true and data, or success false and error message
 */
export async function withToolError<T = any>(
  fallbackMessage: string,
  fn: () => Promise<ToolResult<T>>
): Promise<ToolResult<T>> {
  try {
    return await fn();
  } catch (error: unknown) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : typeof error === "string"
        ? error
        : fallbackMessage;

    return {
      success: false,
      error: message || fallbackMessage,
    };
  }
}

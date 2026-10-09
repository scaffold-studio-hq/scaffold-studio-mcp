/**
 * Stellar Client wrapper
 *
 * Provides utility methods for Stellar operations including transaction
 * building, signing, simulation, and contract invocations.
 *
 * Pattern: Facade - Simplifies Stellar SDK interactions
 */

import { Account, Keypair, rpc, Transaction, TransactionBuilder } from '@stellar/stellar-sdk';
import type { StellarContext, TransactionResult } from './types.js';

export class StellarClient {
  constructor(public readonly context: StellarContext) {}

  /**
   * Get the public key (address)
   */
  getAddress(): string {
    return this.context.keypair.publicKey();
  }

  /**
   * Get the network configuration
   */
  getNetwork() {
    return this.context.network;
  }

  /**
   * Get the RPC server instance
   */
  getRpc(): rpc.Server {
    return this.context.rpc;
  }

  /**
   * Get the keypair
   */
  getKeypair(): Keypair {
    return this.context.keypair;
  }

  /**
   * Create a transaction builder for the current account
   */
  async createTxBuilder(): Promise<TransactionBuilder> {
    const account: Account = await this.context.rpc.getAccount(this.getAddress());

    return new TransactionBuilder(account, {
      fee: '10000',
      timebounds: { minTime: 0, maxTime: 0 },
      networkPassphrase: this.context.network.networkPassphrase,
    });
  }

  /**
   * Simulate, sign, and submit a transaction
   *
   * Follows the Stellar pattern:
   * 1. Simulate transaction
   * 2. Assemble with resource estimation
   * 3. Sign
   * 4. Submit
   * 5. Poll for completion
   */
  async submitTransaction(tx: Transaction): Promise<TransactionResult> {
    // Simulate
    const simulation = await this.context.rpc.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(simulation)) {
      return {
        hash: '',
        status: 'FAILED' as rpc.Api.GetTransactionStatus,
        error: simulation.error,
      };
    }

    // Assemble and sign
    const assembled = rpc.assembleTransaction(tx, simulation).build();
    assembled.sign(this.context.keypair);

    const txHash = assembled.hash().toString('hex');
    console.error(`Submitting transaction: ${txHash}`);

    // Submit
    await this.context.rpc.sendTransaction(assembled);

    // Poll for completion
    let getResponse: rpc.Api.GetTransactionResponse;
    let status: rpc.Api.GetTransactionStatus;

    do {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.error('Checking transaction status...');
      getResponse = await this.context.rpc.getTransaction(txHash);
      status = getResponse.status;
    } while (status === 'NOT_FOUND');

    return {
      hash: txHash,
      status,
      response: getResponse,
    };
  }

  /**
   * Sign transaction XDR
   *
   * Used by generated contract clients
   */
  async signTransaction(txXdr: string): Promise<string> {
    const tx = new Transaction(txXdr, this.context.network.networkPassphrase);
    tx.sign(this.context.keypair);
    return tx.toXDR();
  }
}

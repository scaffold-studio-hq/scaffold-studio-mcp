import {spawnSync} from 'node:child_process';
import {Keypair} from '@stellar/stellar-sdk';
// Never propagate operator credentials or dotenv. A new unfunded key is test-only.
const r=spawnSync(process.execPath,['--test','test/allowhttp.test.ts','test/salt.test.ts','.test-build/utils/serialization.test.js','.test-build/utils/builders.amount.test.js','test/call-tool-handler.test.mjs','test/stdio-protocol.test.mjs','test/transaction-stdio.test.mjs'],{stdio:'inherit',timeout:60000,env:{PATH:process.env.PATH,STELLAR_SECRET_KEY:Keypair.random().secret(),STELLAR_NETWORK:'testnet'}});
if(r.error)throw r.error;process.exitCode=r.status??1;

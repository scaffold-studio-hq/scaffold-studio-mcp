import {spawnSync} from 'node:child_process';
import {Keypair} from '@stellar/stellar-sdk';
import {readdirSync,cpSync,existsSync} from 'node:fs';
// Compiled tests retain the relative source-to-generated-bindings layout.
for(const entry of readdirSync('packages',{withFileTypes:true})){
 const built=`packages/${entry.name}/dist`;
 if(entry.isDirectory()&&existsSync(built))cpSync(built,`.test-suite/${built}`,{recursive:true});
}
const tests=readdirSync('test').filter(name=>/\.test\.(ts|mjs)$/.test(name)).sort()
 .map(name=>name.endsWith('.ts')?`.test-suite/test/${name.replace(/\.ts$/,'.js')}`:`test/${name}`);
// Never propagate operator credentials or dotenv. A new unfunded key is test-only.
const r=spawnSync(process.execPath,['--test',...tests,'.test-build/utils/serialization.test.js','.test-build/utils/builders.amount.test.js'],{stdio:'inherit',timeout:60000,env:{PATH:process.env.PATH,STELLAR_SECRET_KEY:Keypair.random().secret(),STELLAR_NETWORK:'testnet'}});
if(r.error)throw r.error;process.exitCode=r.status??1;

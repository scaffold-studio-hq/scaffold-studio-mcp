import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {Keypair} from '@stellar/stellar-sdk';
import {StellarClient} from '../.test-build/core/WalletClientBase.js';

// Ephemeral, unfunded key. No operator environment, .env or network is required.
async function exerciseServer(pollute=false){
 const child=spawn(process.execPath,[...(pollute?['--import','data:text/javascript,console.log(%22injected-stdout-regression%22)']:[]),'dist/index.js'],{env:{PATH:process.env.PATH,STELLAR_SECRET_KEY:process.env.STELLAR_SECRET_KEY,STELLAR_NETWORK:'testnet'},stdio:['pipe','pipe','pipe']});
 let stdout='',stderr='',pending='';const responses=new Map();let violation;
 child.stdout.on('data',chunk=>{stdout+=chunk;pending+=chunk;let i;while((i=pending.indexOf('\n'))>=0){const line=pending.slice(0,i);pending=pending.slice(i+1);try{const m=JSON.parse(line);assert.equal(m.jsonrpc,'2.0');assert.ok(m.method || ('id' in m && (('result'in m)!==('error'in m))));if('id'in m)responses.set(m.id,m);}catch(e){violation=e;}}});
 child.stderr.on('data',chunk=>{stderr+=chunk;});
 child.on('error',e=>{violation=e});
 const send=m=>child.stdin.write(JSON.stringify(m)+'\n');
 async function receive(id){for(let n=0;n<400;n++){if(violation)throw violation;if(responses.has(id))return responses.get(id);if(child.exitCode!==null)throw Error('Server exited: '+stderr);await new Promise(r=>setTimeout(r,20));}throw Error('Response timeout: '+id)}
 try{
 send({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'offline-stdio-test',version:'1'}}});assert.ok((await receive(1)).result);
 send({jsonrpc:'2.0',method:'notifications/initialized'});
 send({jsonrpc:'2.0',id:2,method:'tools/list',params:{}});const tools=(await receive(2)).result.tools;
 const tool=tools.find(t=>/generateSalt$/i.test(t.name)||/generate_salt$/i.test(t.name));assert.ok(tool,'local salt helper exists');
 send({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:tool.name,arguments:{}}});const call=await receive(3);assert.ok(call.result);assert.notEqual(call.result.isError,true);
 send({jsonrpc:'2.0',id:4,method:'tools/call',params:{name:'nonexistent_offline_tool',arguments:{}}});assert.equal(typeof (await receive(4)).error.code,'number');
 }finally{child.kill('SIGTERM');await Promise.race([new Promise(r=>child.once('close',r)),new Promise(r=>setTimeout(r,1000))]);if(child.exitCode===null)child.kill('SIGKILL');}
 assert.equal(pending,'');if(violation)throw violation;assert.ok(stdout.length>0);assert.match(stderr,/Stellar Studio MCP Server/);
}
const opts={timeout:15000,skip:!process.env.STELLAR_SECRET_KEY && 'STELLAR_SECRET_KEY unset; pnpm test supplies an ephemeral offline key'};
test('built MCP stdio initialize/list/local call/error',opts,()=>exerciseServer());
test('built-server stdout pollution is detected',opts,()=>assert.rejects(exerciseServer(true),/JSON|Unexpected token/));

test('transaction diagnostics use stderr with completely mocked signing and RPC',async()=>{
 let log=[],err=[],calls=[];const oldLog=console.log,oldError=console.error;
 const sdk=await import('@stellar/stellar-sdk');
 // Real SDK assembly requires a simulation fixture; instead stop at a mocked RPC
 // simulation error to prove the failure path never signs or sends.
 const client=new StellarClient({keypair:{},network:{},rpc:{simulateTransaction:async()=>({error:'synthetic-denial'}),sendTransaction:async()=>{calls.push('send');throw Error('forbidden')}}});
 try{console.log=(...x)=>log.push(x);console.error=(...x)=>err.push(x);const result=await client.submitTransaction({});assert.equal(result.status,'FAILED');assert.deepEqual(calls,[]);assert.deepEqual(log,[]);}finally{console.log=oldLog;console.error=oldError;}
});



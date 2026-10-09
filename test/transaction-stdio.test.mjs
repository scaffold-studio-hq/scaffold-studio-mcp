import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../src/core/WalletClientBase.ts',import.meta.url),'utf8');
async function exercise(text){
 const out=[],err=[],calls=[]; const exports={};
 const assembled={sign(){calls.push('sign-mock')},hash(){return {toString(){return 'synthetic'}}}};
 const sdk={rpc:{Api:{isSimulationError:s=>Boolean(s.error)},assembleTransaction:()=>({build:()=>assembled})}};
 vm.runInNewContext(ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>{assert.equal(n,'@stellar/stellar-sdk');return sdk},console:{log:(...v)=>out.push(v.join(' ')),error:(...v)=>err.push(v.join(' '))},setTimeout:fn=>fn()},{timeout:1000});
 const c=new exports.StellarClient({keypair:{},network:{},rpc:{simulateTransaction:async()=>({}),sendTransaction:async()=>{calls.push('send-mock')},getTransaction:async()=>({status:'SUCCESS'})}});
 const result=await c.submitTransaction({});return {out,err,calls,status:result.status};
}
test('successful mocked transaction emits diagnostics only to stderr',async()=>{const r=await exercise(source);assert.deepEqual(r.out,[]);assert.equal(r.err.length,2);assert.deepEqual(r.calls,['sign-mock','send-mock']);assert.equal(r.status,'SUCCESS')});
test('mutation: transaction console.log regression is detected',async()=>{const r=await exercise(source.replaceAll('console.error(', 'console.log('));assert.equal(r.out.length,2);assert.equal(r.err.length,0)});

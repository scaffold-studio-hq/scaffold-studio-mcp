import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { executeCommand, executeCommandSimple } from '../src/utils/executor.ts';
import { parseConstructorArgs } from '../src/plugins/registry/constructor-args.ts';

const printArgs = 'process.stdout.write(JSON.stringify(process.argv.slice(1)))';

describe('safe command executor', () => {
  it('preserves argv boundaries, spaces, quotes, shell metacharacters, and newlines as data', () => {
    const args = [
      'simple',
      'two words',
      'say "hello"',
      'value; process.exit(20)',
      '&& echo injected ||',
      '$(touch never-run)',
      '`touch never-run`',
      'a&b|c<d>e',
      'line\nvalue',
      '"; touch never-run; "',
      '--dry-run',
    ];
    const result = executeCommand(process.execPath, ['-e', printArgs, ...args]);
    assert.deepEqual(JSON.parse(result.stdout), args);
    assert.equal(result.exitCode, 0);
  });

  it('supports executable and working-directory paths containing spaces, env, and stdout', () => {
    const dir = mkdtempSync(join(tmpdir(), 'executor path with spaces '));
    try {
      const result = executeCommandSimple(
        process.execPath,
        [
          '-e',
          'process.stdout.write(process.env.EXECUTOR_TEST + process.cwd())',
        ],
        { cwd: dir, env: { EXECUTOR_TEST: 'ok:' } },
      );
      assert.equal(result, `ok:${dir}`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('captures stderr and reports a failing process', () => {
    assert.throws(
      () =>
        executeCommand(process.execPath, [
          '-e',
          'process.stderr.write("failure"); process.exit(7)',
        ]),
      /failure/,
    );
  });

  it('enforces timeouts and handles a missing executable', () => {
    assert.throws(() =>
      executeCommand(process.execPath, ['-e', 'setTimeout(() => {}, 5000)'], {
        timeout: 50,
      }),
    );
    assert.throws(() =>
      executeCommand('definitely-not-a-real-executable-91', []),
    );
  });
});

describe('constructor argument parsing', () => {
  it('preserves grouped and escaped values while treating metacharacters literally', () => {
    assert.deepEqual(
      parseConstructorArgs(
        '--name "Token Name" --symbol \'TKN\' --memo "a \\"quoted\\" value" $(not-a-command)',
      ),
      [
        '--name',
        'Token Name',
        '--symbol',
        'TKN',
        '--memo',
        'a "quoted" value',
        '$(not-a-command)',
      ],
    );
  });

  it('rejects unmatched quotes and line breaks', () => {
    assert.throws(
      () => parseConstructorArgs('--name "unfinished'),
      /unterminated quote/,
    );
    assert.throws(
      () => parseConstructorArgs('--name token\n--version 2'),
      /newlines/,
    );
  });
});

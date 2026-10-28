import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const biomeCli = fileURLToPath(
  new URL('../node_modules/@biomejs/biome/bin/biome', import.meta.url),
);

const cases: [string, string, boolean][] = [
  ['clear variable', 'const customerCount = 1;', true],
  ['three-character variable', 'const app = 1;', true],
  ['two-character variable', 'const ab = 1;', false],
  ['cryptic variable', 'const a = 1;', false],
  ['wrong variable casing', 'const customer_count = 1;', false],
  ['clear parameter', 'function identify(customerName: string) {}', true],
  ['three-character parameter', 'function identify(req: string) {}', true],
  ['two-character parameter', 'function identify(ab: string) {}', false],
  ['cryptic parameter', 'function identify(a: string) {}', false],
  ['wrong parameter casing', 'function identify(customer_name: string) {}', false],
  ['variable exceptions', 'const id = 1; const db = {};', true],
  ['parameter exceptions', 'function identify(id: string, db: object) {}', true],
  ['module constant', 'const SESSION_TTL_MS = 1000;', true],
  ['existing acronym casing', 'const customerID = "customer-1";', true],
  ['PascalCase variable', 'const Widget = () => null;', true],
  ['local constant casing', 'function identify() { const BAD_NAME = 1; }', false],
  ['catch parameter', 'try {} catch (ab) {}', false],
  ['index parameter', 'type CustomerMap = { [ab: string]: string };', false],
];

for (const [description, source, shouldPass] of cases) {
  test(`naming convention: ${description}`, () => {
    const fixtureDirectory = mkdtempSync(join(tmpdir(), 'biome-naming-'));
    try {
      const fixturePath = join(fixtureDirectory, 'fixture.ts');
      writeFileSync(fixturePath, `${source}\n`);

      const result = spawnSync(
        process.execPath,
        [
          biomeCli,
          'lint',
          '--only=style/useNamingConvention',
          `--config-path=${projectRoot}`,
          '--vcs-enabled=false',
          fixturePath,
        ],
        { cwd: projectRoot, encoding: 'utf8' },
      );

      assert.ifError(result.error);
      assert.equal(result.signal, null);

      const output = `${result.stdout}\n${result.stderr}`;
      assert.equal(result.status, shouldPass ? 0 : 1, output);

      if (!shouldPass) {
        assert.match(output, /lint\/style\/useNamingConvention/);
      }
    } finally {
      rmSync(fixtureDirectory, { recursive: true, force: true });
    }
  });
}

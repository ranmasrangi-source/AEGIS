import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}

describe('Phase 1 Security & Static Verification Suite (Section 3.5 & Section 12.G)', () => {
  it('1. verifies zero forbidden trade execution calls in /ea/ (OrderSend, OrderSendAsync, PositionModify, PositionClose, CTrade)', () => {
    const eaDir = path.resolve(process.cwd(), 'ea');
    const eaFiles = getAllFiles(eaDir);
    assert.ok(eaFiles.length >= 10, 'Expected at least 10 files in /ea/');

    const forbiddenIdentifiers = [
      'OrderSend',
      'OrderSendAsync',
      'PositionModify',
      'PositionClose',
      'CTrade',
    ];

    for (const file of eaFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const forbidden of forbiddenIdentifiers) {
        assert.equal(
          content.includes(forbidden),
          false,
          `Forbidden Phase 1 identifier "${forbidden}" found in ${file}`
        );
      }
    }
  });

  it('2. verifies /ea/AegisXAU.mq5 contains the mandatory #ifndef AEGIS_PHASE_1_READ_ONLY_ONLY compile guard', () => {
    const mq5Path = path.resolve(process.cwd(), 'ea/AegisXAU.mq5');
    const content = fs.readFileSync(mq5Path, 'utf-8');
    assert.ok(content.includes('#ifndef AEGIS_PHASE_1_READ_ONLY_ONLY'));
    assert.ok(content.includes('#error'));
  });

  it('3. verifies .env.example contains only empty values and no real secret strings', () => {
    const envExamplePath = path.resolve(process.cwd(), '.env.example');
    const content = fs.readFileSync(envExamplePath, 'utf-8');
    const lines = content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    for (const line of lines) {
      const [key, val] = line.split('=');
      assert.ok(key && key.length > 0);
      assert.equal(val, '', `.env.example key ${key} must have an empty value`);
    }
  });

  it('4. verifies firestore.rules denies all browser writes in Phase 1 and restricts reads to verified owner', () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf-8');

    assert.ok(rules.includes('adventurenepal04@gmail.com'));
    assert.ok(rules.includes('email_verified == true'));
    const writeAllowMatches = rules.match(/allow\s+write\s*:\s*if\s+true/g);
    assert.equal(writeAllowMatches, null, 'No collection may allow unrestricted writes');
    const createUpdateDeleteFalse = rules.match(/allow\s+create,\s*update,\s*delete\s*:\s*if\s+false/g);
    assert.ok(
      (createUpdateDeleteFalse?.length ?? 0) >= 12,
      'Expected all Phase 1 collections to explicitly set allow create, update, delete: if false'
    );
  });
});

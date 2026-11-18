import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  personnelPasswordRequirements,
  passwordMeetsPersonnelPolicy,
  readFragmentToken
} from '../src/lib/personnelSecurity.ts';
import { actionsForPortalState } from '../src/lib/personnelPortalAccess.ts';

test('activation and reset fragments are parsed without accepting empty tokens', () => {
  assert.equal(readFragmentToken('#token=private-value'), 'private-value');
  assert.equal(readFragmentToken('#token='), null);
  assert.equal(readFragmentToken(''), null);
});

test('frontend password policy matches the backend activation/reset policy', () => {
  assert.equal(passwordMeetsPersonnelPolicy('Abc#123'), false);
  assert.equal(passwordMeetsPersonnelPolicy('Abcd#123'), true);
  assert.equal(passwordMeetsPersonnelPolicy('Personnel#Pass2026'), true);
  assert.equal(passwordMeetsPersonnelPolicy('Personnel Password#2026'), false);
  assert.equal(passwordMeetsPersonnelPolicy('personnelpassword#2026'), false);
  assert.equal(passwordMeetsPersonnelPolicy('PERSONNEL#2026'), false);
  assert.equal(passwordMeetsPersonnelPolicy('PersonnelPassword'), false);
  assert.equal(passwordMeetsPersonnelPolicy('Personnel2026'), false);
  assert.equal(personnelPasswordRequirements('Abcd#123').recommendedLength, false);
  assert.equal(personnelPasswordRequirements('Personnel#12').recommendedLength, true);
});

test('personnel password controls provide accessible show and hide behavior', async () => {
  const [input, fields, login] = await Promise.all([
    readFile(new URL('../src/components/personnel/PasswordInput.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/personnel/PasswordFields.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/personnel/login/page.tsx', import.meta.url), 'utf8')
  ]);
  assert.match(input, /type=\{visible \? 'text' : 'password'\}/);
  assert.match(input, /setVisible\(current => !current\)/);
  assert.match(input, /aria-label=\{visibilityLabel\}/);
  assert.match(input, /aria-pressed=\{visible\}/);
  assert.equal((fields.match(/<PasswordInput/g) || []).length, 2);
  assert.equal((login.match(/<PasswordInput/g) || []).length, 1);
  assert.match(fields, /aria-live="polite"/);
});

test('personnel API is cookie-only, credentialed and sends CSRF on logout', async () => {
  const source = await readFile(new URL('../src/lib/personnelPortalApi.ts', import.meta.url), 'utf8');
  assert.match(source, /withCredentials:\s*true/);
  assert.match(source, /'X-CSRF-Token': csrfToken/);
  assert.match(source, /get\('\/personnel-auth\/session'\)/);
  assert.doesNotMatch(source, /Authorization\s*:/);
  assert.doesNotMatch(source, /localStorage/);
  assert.match(source, /get\('\/personnel-portal\/me'\)/);
});

test('raw link tokens are removed from browser history and never persisted', async () => {
  const source = await readFile(new URL('../src/hooks/usePersonnelLinkToken.ts', import.meta.url), 'utf8');
  assert.match(source, /history\.replaceState/);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
});

test('activation link initialization survives React Strict Mode effect replay', async () => {
  const source = await readFile(new URL('../src/hooks/usePersonnelLinkToken.ts', import.meta.url), 'utf8');
  assert.match(source, /useRef<CapturedLinkToken \| null>\(null\)/);
  assert.match(source, /initialCapture\.current \?\?=/);
  assert.match(source, /setCaptured\(initialCapture\.current\)/);
  assert.doesNotMatch(source, /setCaptured\(\{\s*token:\s*readFragmentToken/);
});

test('manager portal API uses only the approved ownership-enforcing endpoints', async () => {
  const source = await readFile(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
  for (const suffix of ['portal-access', 'portal-access/invite', 'portal-access/resend', 'portal-access/disable', 'portal-access/enable']) {
    assert.ok(source.includes(suffix), `missing manager endpoint ${suffix}`);
  }
});

test('manager controls expose only valid actions for each backend portal state', () => {
  assert.deepEqual(actionsForPortalState('NOT_GRANTED'), ['invite']);
  assert.deepEqual(actionsForPortalState('PENDING_ACTIVATION'), ['resend', 'disable']);
  assert.deepEqual(actionsForPortalState('ENABLED'), ['disable']);
  assert.deepEqual(actionsForPortalState('DISABLED'), ['enable']);
});

test('login and logout are routed through the isolated personnel session context', async () => {
  const [loginPage, dashboard] = await Promise.all([
    readFile(new URL('../src/app/personnel/login/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/personnel/page.tsx', import.meta.url), 'utf8')
  ]);
  assert.match(loginPage, /await login\(email, password\)/);
  assert.match(loginPage, /router\.replace\('\/personnel'\)/);
  assert.match(dashboard, /await logout\(\)/);
  assert.match(dashboard, /No current work schedule/);
  assert.match(dashboard, /profile\.assignments\.map/);
});

test('activation and reset pages consume only fragment tokens through the secure hook', async () => {
  const [activation, reset] = await Promise.all([
    readFile(new URL('../src/app/personnel/activate/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/personnel/reset-password/page.tsx', import.meta.url), 'utf8')
  ]);
  assert.match(activation, /usePersonnelLinkToken\(\)/);
  assert.match(activation, /personnelAuthAPI\.activate\(token, password\)/);
  assert.match(reset, /usePersonnelLinkToken\(\)/);
  assert.match(reset, /personnelAuthAPI\.resetPassword\(token, password\)/);
});

test('self-service dashboard never supplies an arbitrary personnel, user or property identifier', async () => {
  const api = await readFile(new URL('../src/lib/personnelPortalApi.ts', import.meta.url), 'utf8');
  const getMeBlock = api.slice(api.indexOf('getMe:'));
  assert.match(getMeBlock, /get\('\/personnel-portal\/me'\)/);
  assert.doesNotMatch(getMeBlock, /personnelId|userId|propertyId/);
});

test('personnel dashboard distinguishes current and upcoming assignments', async () => {
  const [dashboard, types] = await Promise.all([
    readFile(new URL('../src/app/personnel/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/types/personnelPortal.ts', import.meta.url), 'utf8')
  ]);
  assert.match(dashboard, /profile\?\.upcomingAssignments \|\| \[\]/);
  assert.match(dashboard, /Upcoming assignments/);
  assert.match(dashboard, /become current on their start date/);
  assert.match(types, /upcomingAssignments: PersonnelPortalAssignment\[\]/);
  assert.match(types, /assignmentTiming: 'CURRENT' \| 'UPCOMING'/);
});

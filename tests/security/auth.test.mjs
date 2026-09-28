import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const SECRET = 'test-secret-key-32-chars-long-abc';

function sign(message, secret) {
  return crypto.createHmac('sha256', secret).update(message).digest('base64url');
}

function verify(message, signature, secret) {
  const expectedSignature = sign(message, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function createToken(payload, secret, durationMs = 1000 * 60 * 60) {
  const fullPayload = {
    ...payload,
    expiresAt: Date.now() + durationMs,
  };
  const jsonStr = JSON.stringify(fullPayload);
  const payloadB64 = Buffer.from(jsonStr).toString('base64url');
  const signature = sign(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

function verifyToken(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  if (!verify(payloadB64, signature, secret)) return null;

  const jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
  const payload = JSON.parse(jsonStr);
  if (!payload.expiresAt || payload.expiresAt < Date.now()) return null;
  return payload;
}

describe('Cryptographic Authentication & Session Tokens', () => {
  test('successfully generates and verifies a valid scheduler session token', () => {
    const token = createToken({ role: 'scheduler' }, SECRET);
    const verified = verifyToken(token, SECRET);

    assert.ok(verified, 'Token should be verified');
    assert.equal(verified.role, 'scheduler');
    assert.ok(verified.expiresAt > Date.now());
  });

  test('successfully generates and verifies a team_rep session token with metadata', () => {
    const token = createToken({ role: 'team_rep', teamId: 'team-1', leagueId: 'league-1' }, SECRET);
    const verified = verifyToken(token, SECRET);

    assert.ok(verified);
    assert.equal(verified.role, 'team_rep');
    assert.equal(verified.teamId, 'team-1');
    assert.equal(verified.leagueId, 'league-1');
  });

  test('rejects token when payload is tampered with (privilege escalation attempt)', () => {
    const originalToken = createToken({ role: 'team_rep', teamId: 'team-1' }, SECRET);
    const [payloadB64, signature] = originalToken.split('.');

    // Attacker tampers payload to escalate role to scheduler
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    decoded.role = 'scheduler';
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(decoded)).toString('base64url');
    const tamperedToken = `${tamperedPayloadB64}.${signature}`;

    const verified = verifyToken(tamperedToken, SECRET);
    assert.equal(verified, null, 'Tampered token must be rejected');
  });

  test('rejects token when signature is altered or forged', () => {
    const token = createToken({ role: 'scheduler' }, SECRET);
    const [payloadB64] = token.split('.');
    const forgedToken = `${payloadB64}.forgedSignature1234567890`;

    const verified = verifyToken(forgedToken, SECRET);
    assert.equal(verified, null, 'Forged signature must be rejected');
  });

  test('rejects token signed with an invalid secret key', () => {
    const token = createToken({ role: 'scheduler' }, 'wrong-secret-key-00000000000000');
    const verified = verifyToken(token, SECRET);
    assert.equal(verified, null, 'Token signed with wrong key must be rejected');
  });

  test('rejects expired tokens safely', () => {
    // Generate token that expired 10 seconds ago
    const expiredToken = createToken({ role: 'scheduler' }, SECRET, -10000);
    const verified = verifyToken(expiredToken, SECRET);
    assert.equal(verified, null, 'Expired token must be rejected');
  });

  test('timing-safe comparison rejects signatures of varying lengths safely', () => {
    const isSafe = verify('payload', 'short', SECRET);
    assert.equal(isSafe, false);
  });
});

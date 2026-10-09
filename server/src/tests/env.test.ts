import { describe, expect, it } from 'vitest';
import { loadEnv } from '../config/env.js';

const valid = {
  NODE_ENV: 'test',
  PORT: '3000',
  FRONTEND_ORIGIN: 'http://localhost:5173',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'publishable',
  SUPABASE_SECRET_KEY: 'secret',
};

describe('loadEnv', () => {
  it('parses a valid environment', () => {
    const env = loadEnv(valid);
    expect(env.PORT).toBe(3000);
    expect(env.FRONTEND_ORIGIN).toBe('http://localhost:5173');
  });

  it('defaults NODE_ENV and PORT when omitted', () => {
    const env = loadEnv({
      FRONTEND_ORIGIN: valid.FRONTEND_ORIGIN,
      SUPABASE_URL: valid.SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY: valid.SUPABASE_PUBLISHABLE_KEY,
      SUPABASE_SECRET_KEY: valid.SUPABASE_SECRET_KEY,
    });
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
  });

  it('throws a non-sensitive error listing missing variable names', () => {
    expect(() => loadEnv({ ...valid, SUPABASE_SECRET_KEY: '' })).toThrowError(
      /SUPABASE_SECRET_KEY/,
    );
  });

  it('rejects an invalid SUPABASE_URL without leaking values', () => {
    let message = '';
    try {
      loadEnv({ ...valid, SUPABASE_URL: 'not-a-url' });
    } catch (err) {
      message = err instanceof Error ? err.message : '';
    }
    expect(message).toContain('SUPABASE_URL');
    expect(message).not.toContain('not-a-url');
  });
});

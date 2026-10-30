import { describe, it, expect, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { parseRecoveryLink } from '@/lib/recoveryLinks';
import { normalizePhotoDraft } from '@/lib/appointmentPhoto';

describe('recovery links', () => {
  it('accepts only the app host reset path', () => {
    expect(parseRecoveryLink('https://imal-appointments.lovable.app/reset-password?token_hash=a&type=recovery')?.tokenHash).toBe('a');
    expect(parseRecoveryLink('https://evil.com/reset-password?token_hash=a')).toBeNull();
    expect(parseRecoveryLink('https://imal-appointments.lovable.app/other')).toBeNull();
  });
});
describe('photo draft', () => {
  it('drops invalid date and time', () => {
    const d = normalizePhotoDraft({ examType: ' דם ', location: null, date: '2026-02-31', time: '25:00' });
    expect(d).toEqual({ examType: 'דם', location: null, date: null, time: null });
  });
});

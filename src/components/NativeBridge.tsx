import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as NativeApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { supabase } from '@/integrations/supabase/client';
import { parseRecoveryLink } from '@/lib/recoveryLinks';
import { toast } from 'sonner';

export function NativeBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    const cleanups: (() => void)[] = [];
    let lastLink = '';
    const openLink = async (value: string) => {
      const link = parseRecoveryLink(value);
      if (!link || value === lastLink) return;
      lastLink = value;
      navigate('/reset-password');
      try {
        let error;
        if (link.tokenHash && link.type === 'recovery') {
          ({ error } = await supabase.auth.verifyOtp({ token_hash: link.tokenHash, type: 'recovery' }));
        } else if (link.accessToken && link.refreshToken && link.type === 'recovery') {
          ({ error } = await supabase.auth.setSession({ access_token: link.accessToken, refresh_token: link.refreshToken }));
        } else if (link.code) {
          ({ error } = await supabase.auth.exchangeCodeForSession(link.code));
        } else { throw new Error('קישור האיפוס חסר או אינו תקין. בקשי קישור חדש.'); }
        if (error) throw error;
        window.dispatchEvent(new Event('native-password-recovery'));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'קישור האיפוס אינו תקין');
      }
    };
    const register = async () => {
      const handles = await Promise.all([
        NativeApp.addListener('appUrlOpen', ({ url }) => { void openLink(url); }),
        Keyboard.addListener('keyboardDidShow', () => {
          document.body.classList.add('keyboard-open');
          document.activeElement?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }),
        Keyboard.addListener('keyboardDidHide', () => document.body.classList.remove('keyboard-open')),
      ]);
      if (disposed) { handles.forEach(h => { void h.remove(); }); return; }
      handles.forEach(h => cleanups.push(() => { void h.remove(); }));
      const launch = await NativeApp.getLaunchUrl();
      if (launch?.url) await openLink(launch.url);
    };
    void register().catch(() => toast.error('לא ניתן לפתוח את קישור האייפון'));
    return () => { disposed = true; cleanups.forEach(fn => fn()); document.body.classList.remove('keyboard-open'); };
  }, [navigate]);
  return null;
}
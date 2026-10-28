import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

export const photoDraftSchema = z.object({
  examType: z.string().nullable(), location: z.string().nullable(),
  date: z.string().nullable(), time: z.string().nullable(),
}).strict();
export type PhotoDraft = z.infer<typeof photoDraftSchema>;

export function normalizePhotoDraft(value: unknown): PhotoDraft {
  const draft = photoDraftSchema.parse(value);
  const dateValid = draft.date && /^\d{4}-\d{2}-\d{2}$/.test(draft.date) &&
    !Number.isNaN(Date.parse(draft.date)) && new Date(draft.date).toISOString().slice(0, 10) === draft.date;
  return { examType: draft.examType?.trim().slice(0, 300) || null,
    location: draft.location?.trim().slice(0, 500) || null,
    date: dateValid ? draft.date : null,
    time: draft.time && /^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time) ? draft.time : null };
}

export async function extractAppointmentPhoto(image: string, signal: AbortSignal): Promise<PhotoDraft> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('צריך להתחבר כדי לקרוא את ההזמנה');
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-appointment`, {
    method: 'POST', signal,
    headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'לא ניתן לקרוא את ההזמנה כעת');
  }
  if (!response.body) throw new Error('לא התקבלה תשובה לקריאת ההזמנה');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  while (true) {
    const { value, done } = await reader.read();
    pending += decoder.decode(value, { stream: !done });
    const lines = pending.split('\n'); pending = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      if (event.error) throw new Error(event.error);
      if (event.draft) return normalizePhotoDraft(event.draft);
    }
    if (done) break;
  }
  throw new Error('לא נמצאו פרטי תור. אפשר למלא אותם ידנית.');
}
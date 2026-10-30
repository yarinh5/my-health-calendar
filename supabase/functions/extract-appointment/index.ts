import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from './run-id.ts';

const Body = z.object({
  image: z.string().regex(/^data:image\/(jpeg|png|webp|heic|heif);base64,/).max(12_000_000),
});

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const schema = {
  type: 'object', additionalProperties: false,
  required: ['examType', 'location', 'date', 'time'],
  properties: {
    examType: { type: ['string', 'null'] }, location: { type: ['string', 'null'] },
    date: { type: ['string', 'null'], description: 'YYYY-MM-DD' },
    time: { type: ['string', 'null'], description: 'HH:MM 24h' },
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return json({ error: 'צריך להתחבר' }, 401);
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: claims, error: authError } = await supabase.auth.getClaims(auth.slice(7));
  if (authError || !claims?.claims?.sub) return json({ error: 'צריך להתחבר' }, 401);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: 'התמונה אינה תקינה או גדולה מדי' }, 400);

  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) return json({ error: 'שירות קריאת ההזמנות לא הוגדר' }, 500);

  const today = new Date().toISOString().slice(0, 10);
  const runFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));
  let upstream: Response;
  try {
    upstream = await runFetch.fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST', signal: req.signal,
      headers: { 'Lovable-API-Key': key, 'Content-Type': 'application/json', 'X-Lovable-AIG-SDK': 'fetch' },
      body: JSON.stringify({
        model: 'openai/gpt-6-astra', stream: true, store: false,
        reasoning: { effort: 'low' },
        instructions: `Extract a medical appointment from the photo (usually Hebrew, Israeli HMO). Today is ${today}. Return examType (type of exam/doctor), location (clinic/address), date (YYYY-MM-DD; Israeli dates are DD/MM), time (HH:MM). Use null for anything not clearly visible. Never guess.`,
        input: [{ role: 'user', content: [
          { type: 'input_text', text: 'חלצי את פרטי התור מהתמונה.' },
          { type: 'input_image', image_url: parsed.data.image },
        ] }],
        text: { format: { type: 'json_schema', name: 'appointment', strict: true, schema } },
      }),
    });
  } catch (e) {
    if (req.signal.aborted) return new Response(null, { status: 499, headers: corsHeaders });
    return json({ error: 'לא ניתן לקרוא את ההזמנה כעת' }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    const status = upstream.status;
    const msg = status === 429 ? 'יותר מדי בקשות, נסי שוב בעוד דקה'
      : status === 402 ? 'נגמרו הקרדיטים לקריאת הזמנות'
      : status === 403 ? 'קריאת ההזמנה נחסמה' : 'לא ניתן לקרוא את ההזמנה כעת';
    console.error('gateway status', status);
    return json({ error: msg }, status >= 400 && status < 600 ? status : 502);
  }

  const reader = upstream.body.getReader();
  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const dec = new TextDecoder();
      let buf = '', text = '';
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n'); buf = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (!data || data === '[DONE]') continue;
            const ev = JSON.parse(data);
            if (ev.type === 'response.output_text.delta') text += ev.delta;
            if (ev.type === 'response.refusal.delta' || ev.type === 'response.failed' || ev.type === 'error') {
              throw new Error('refused');
            }
          }
        }
        if (!text) throw new Error('empty');
        controller.enqueue(enc.encode(JSON.stringify({ draft: JSON.parse(text) }) + '\n'));
      } catch {
        controller.enqueue(enc.encode(JSON.stringify({ error: 'לא נמצאו פרטי תור. אפשר למלא אותם ידנית.' }) + '\n'));
      }
      controller.close();
    },
    cancel(reason) { return reader.cancel(reason); },
  });
  const headers: Record<string, string> = { ...corsHeaders, 'Content-Type': 'application/x-ndjson' };
  const runId = runFetch.getRunId();
  if (runId) { headers['X-Lovable-AIG-Run-ID'] = runId; headers['Access-Control-Expose-Headers'] = 'X-Lovable-AIG-Run-ID'; }
  return new Response(body, { headers });
});

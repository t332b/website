const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let payload: { slug: string; body: string; author_name?: string; parent_id?: string | null };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const { slug, body: commentBody, author_name, parent_id } = payload;
  if (!slug || !commentBody?.trim()) return json({ error: 'missing_fields' }, 400);

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';
  const ipHash = await hashIp(ip);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'count=exact',
  };

  const now = new Date();
  const oneMinAgo = new Date(now.getTime() - 60_000).toISOString();
  const tenMinAgo = new Date(now.getTime() - 600_000).toISOString();

  // 短期制限: 1分で3回まで
  const r1 = await fetch(
    `${SUPABASE_URL}/rest/v1/note_comments?ip_hash=eq.${ipHash}&created_at=gte.${oneMinAgo}&select=id`,
    { headers },
  );
  const shortCount = parseInt(r1.headers.get('Content-Range')?.split('/')[1] ?? '0');
  if (shortCount >= 3) {
    return json({ error: 'rate_limit', message: '1分間に3回まで送信できます。少し待ってください。' }, 429);
  }

  // 長期制限: 10分で5回まで
  const r2 = await fetch(
    `${SUPABASE_URL}/rest/v1/note_comments?ip_hash=eq.${ipHash}&created_at=gte.${tenMinAgo}&select=id`,
    { headers },
  );
  const longCount = parseInt(r2.headers.get('Content-Range')?.split('/')[1] ?? '0');
  if (longCount >= 5) {
    return json({ error: 'rate_limit', message: '10分間に5回まで送信できます。少し待ってください。' }, 429);
  }

  // slug 内のコメント数から anon_number を算出
  const r3 = await fetch(
    `${SUPABASE_URL}/rest/v1/note_comments?slug=eq.${encodeURIComponent(slug)}&select=id`,
    { headers },
  );
  const anonNumber = parseInt(r3.headers.get('Content-Range')?.split('/')[1] ?? '0') + 1;

  // 挿入
  const r4 = await fetch(`${SUPABASE_URL}/rest/v1/note_comments`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({
      slug,
      body: commentBody.trim(),
      author_name: author_name?.trim() || null,
      parent_id: parent_id || null,
      anon_number: anonNumber,
      ip_hash: ipHash,
    }),
  });

  if (!r4.ok) {
    const err = await r4.text();
    console.error('insert error:', err);
    return json({ error: 'insert_failed' }, 500);
  }

  return json({ ok: true });
});

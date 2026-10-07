// Privacy-first analytics endpoint.
// Configure Supabase env vars in Vercel: SUPABASE_URL and SUPABASE_SECRET_KEY.
// Table suggestion: mirror_events(id bigint identity, participant_id text, event text, meta jsonb, created_at timestamptz default now()).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { participant_id, event, meta = {} } = req.body || {};
  if (!participant_id || !event) return res.status(400).json({ error: 'Invalid event' });
  // Defense in depth: never accept likely journal-content fields.
  const safeMeta = {};
  const allow = ['mood','resonated','count','feature','day'];
  for (const k of allow) if (Object.prototype.hasOwnProperty.call(meta,k)) safeMeta[k] = meta[k];
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return res.status(204).end();
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/qk_events`, {
      method:'POST',
      headers:{'content-type':'application/json','apikey':process.env.SUPABASE_SECRET_KEY,'authorization':`Bearer ${process.env.SUPABASE_SECRET_KEY}`,'prefer':'return=minimal'},
      body:JSON.stringify({participant_id,event_type:event,challenge_day:Number.isInteger(meta.day) && meta.day >= 1 && meta.day <= 30 ? meta.day : null})
    });
    if(!r.ok) return res.status(502).json({error:'Analytics unavailable'});
    return res.status(204).end();
  } catch(e){ return res.status(204).end(); }
}

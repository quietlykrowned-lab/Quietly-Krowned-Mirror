
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const expected = process.env.ADMIN_TOKEN;

  if (!expected || !token || token !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    return res.status(503).json({ error: "Database not configured" });
  }

  try {
    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/qk_events?select=participant_id,event_type,challenge_day,created_at.asc&limit=10000`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        }
      }
    );

    if (!response.ok) {
      return res.status(502).json({ error: "Unable to load analytics" });
    }

    const events = await response.json();
    const participants = new Map();

    for (const row of events) {
      if (!row.participant_id) continue;

      if (!participants.has(row.participant_id)) {
        participants.set(row.participant_id, {
          id: row.participant_id,
          entries: 0,
          mirrorUses: 0,
          patternUses: 0,
          energyUses: 0,
          activeDates: new Set(),
          lastActive: null
        });
      }

      const p = participants.get(row.participant_id);
      const day = row.created_at?.slice(0, 10);

      if (day) p.activeDates.add(day);
      if (!p.lastActive || row.created_at > p.lastActive) {
        p.lastActive = row.created_at;
      }

     if (row.event_type === "entry_saved") p.entries++;
if (row.event_type === "mirror_used") p.mirrorUses++;
if (row.event_type === "patterns_used") p.patternUses++;
if (row.event_type === "energy_used") p.energyUses++;
    }

    const people = [...participants.values()].map(p => ({
      id: p.id,
      entries: p.entries,
      mirrorUses: p.mirrorUses,
      patternUses: p.patternUses,
      energyUses: p.energyUses,
      activeDays: p.activeDates.size,
      lastActive: p.lastActive
    }));

    return res.status(200).json({
      participants: people.length,
      totalEntries: people.reduce((n, p) => n + p.entries, 0),
      totalMirrorUses: people.reduce((n, p) => n + p.mirrorUses, 0),
      people
    });
  } catch {
    return res.status(500).json({ error: "Analytics request failed" });
  }
}

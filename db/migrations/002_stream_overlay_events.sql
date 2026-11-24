-- Stream-wide interaction events, independent of the Millionaire game session.
CREATE TABLE IF NOT EXISTS stream_overlay_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('emoji', 'message', 'sound')),
  value text NOT NULL,
  actor_key varchar(80) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stream_overlay_events_created_at
  ON stream_overlay_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stream_overlay_events_actor_rate_limit
  ON stream_overlay_events (actor_key, created_at DESC);

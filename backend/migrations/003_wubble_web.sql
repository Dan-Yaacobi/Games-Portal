CREATE TABLE IF NOT EXISTS word_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL UNIQUE,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS word_category_links (
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES word_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (word_id, category_id)
);

CREATE TABLE IF NOT EXISTS wubble_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_session_id UUID NOT NULL UNIQUE REFERENCES game_sessions(id) ON DELETE CASCADE,
  word_difficulty TEXT NOT NULL CHECK (word_difficulty IN ('easy', 'medium', 'hard')),
  speed_difficulty TEXT NOT NULL CHECK (speed_difficulty IN ('normal', 'fast', 'extreme', 'usain_bolt')),
  duration_seconds INTEGER NOT NULL DEFAULT 120,
  prompt_schedule_json JSONB NOT NULL,
  spawn_plan_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wubble_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wubble_session_id UUID NOT NULL UNIQUE REFERENCES wubble_sessions(id) ON DELETE CASCADE,
  submitted_event_log_json JSONB NOT NULL,
  validated_score INTEGER NOT NULL,
  validation_summary_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_words_difficulty_level ON words(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_word_category_links_category_id ON word_category_links(category_id);
CREATE INDEX IF NOT EXISTS idx_word_category_links_word_id ON word_category_links(word_id);
CREATE INDEX IF NOT EXISTS idx_wubble_sessions_platform_session_id ON wubble_sessions(platform_session_id);

INSERT INTO games (name, slug, is_active)
VALUES ('Wubble Web', 'wubble-web', true)
ON CONFLICT (slug) DO UPDATE SET is_active = EXCLUDED.is_active;

INSERT INTO word_categories (slug, label)
VALUES
  ('animals', 'animals'),
  ('colors-yellow', 'yellow things'),
  ('fruits', 'fruits'),
  ('vehicles', 'vehicles'),
  ('sports', 'sports items'),
  ('kitchen', 'kitchen things'),
  ('school', 'school things'),
  ('weather', 'weather things'),
  ('music', 'music things'),
  ('technology', 'technology things'),
  ('nature', 'nature things'),
  ('jobs', 'jobs'),
  ('buildings', 'buildings'),
  ('body-parts', 'body parts'),
  ('space', 'space things')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO words (text, difficulty_level)
VALUES
  ('cat', 'easy'),('dog', 'easy'),('lion', 'easy'),('tiger', 'easy'),('horse', 'easy'),
  ('sheep', 'easy'),('goat', 'easy'),('cow', 'easy'),('apple', 'easy'),('banana', 'easy'),
  ('grape', 'easy'),('orange', 'easy'),('bus', 'easy'),('car', 'easy'),('bike', 'easy'),
  ('train', 'easy'),('sun', 'easy'),('rain', 'easy'),('cloud', 'easy'),('wind', 'easy'),

  ('giraffe', 'medium'),('penguin', 'medium'),('dolphin', 'medium'),('avocado', 'medium'),('broccoli', 'medium'),
  ('carrot', 'medium'),('scooter', 'medium'),('subway', 'medium'),('helmet', 'medium'),('racket', 'medium'),
  ('basketball', 'medium'),('notebook', 'medium'),('backpack', 'medium'),('library', 'medium'),('piano', 'medium'),
  ('guitar', 'medium'),('monitor', 'medium'),('keyboard', 'medium'),('forest', 'medium'),('river', 'medium'),

  ('astronaut', 'hard'),('galaxy', 'hard'),('nebula', 'hard'),('meteorite', 'hard'),('algorithm', 'hard'),
  ('microchip', 'hard'),('skyscraper', 'hard'),('pharmacist', 'hard'),('architect', 'hard'),('stethoscope', 'hard'),
  ('xylophone', 'hard'),('thermometer', 'hard'),('parliament', 'hard'),('laboratory', 'hard'),('symphony', 'hard'),
  ('cyclone', 'hard'),('volcano', 'hard'),('canyon', 'hard'),('satellite', 'hard'),('telescope', 'hard')
ON CONFLICT (text) DO NOTHING;

WITH links(word_text, category_slug) AS (
  VALUES
  ('cat','animals'),('dog','animals'),('lion','animals'),('tiger','animals'),('horse','animals'),('sheep','animals'),('goat','animals'),('cow','animals'),
  ('giraffe','animals'),('penguin','animals'),('dolphin','animals'),

  ('banana','colors-yellow'),('sun','colors-yellow'),('carrot','colors-yellow'),('helmet','colors-yellow'),('telescope','colors-yellow'),

  ('apple','fruits'),('banana','fruits'),('grape','fruits'),('orange','fruits'),('avocado','fruits'),

  ('bus','vehicles'),('car','vehicles'),('bike','vehicles'),('train','vehicles'),('scooter','vehicles'),('subway','vehicles'),

  ('helmet','sports'),('racket','sports'),('basketball','sports'),('bike','sports'),

  ('carrot','kitchen'),('broccoli','kitchen'),('stethoscope','kitchen'),

  ('notebook','school'),('backpack','school'),('library','school'),('keyboard','school'),

  ('sun','weather'),('rain','weather'),('cloud','weather'),('wind','weather'),('cyclone','weather'),('thermometer','weather'),

  ('piano','music'),('guitar','music'),('xylophone','music'),('symphony','music'),

  ('monitor','technology'),('keyboard','technology'),('algorithm','technology'),('microchip','technology'),('satellite','technology'),('telescope','technology'),

  ('forest','nature'),('river','nature'),('volcano','nature'),('canyon','nature'),('cloud','nature'),

  ('astronaut','jobs'),('architect','jobs'),('pharmacist','jobs'),

  ('library','buildings'),('skyscraper','buildings'),('parliament','buildings'),('laboratory','buildings'),

  ('helmet','body-parts'),('stethoscope','body-parts'),

  ('astronaut','space'),('galaxy','space'),('nebula','space'),('meteorite','space'),('satellite','space'),('telescope','space')
)
INSERT INTO word_category_links (word_id, category_id)
SELECT w.id, c.id
FROM links l
JOIN words w ON w.text = l.word_text
JOIN word_categories c ON c.slug = l.category_slug
ON CONFLICT DO NOTHING;

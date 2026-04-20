UPDATE word_categories
SET label = 'technology devices'
WHERE slug = 'technology';

UPDATE word_categories
SET label = 'scientific tools'
WHERE slug = 'science';

WITH links(word_text, category_slug) AS (
  VALUES
    ('monitor', 'technology'),
    ('keyboard', 'technology'),
    ('router', 'technology'),
    ('server', 'technology'),
    ('microchip', 'technology'),
    ('satellite', 'technology'),
    ('telescope', 'technology'),
    ('autopilot', 'technology'),
    ('accelerometer', 'technology'),
    ('oscilloscope', 'technology'),
    ('microscope', 'science'),
    ('observatory', 'science'),
    ('thermometer', 'science'),
    ('anemometer', 'science'),
    ('seismograph', 'science'),
    ('hydrometeor', 'science'),
    ('biotechnology', 'science'),
    ('nanotechnology', 'science')
)
INSERT INTO word_category_links (word_id, category_id)
SELECT w.id, c.id
FROM links l
JOIN words w ON w.text = l.word_text
JOIN word_categories c ON c.slug = l.category_slug
ON CONFLICT DO NOTHING;

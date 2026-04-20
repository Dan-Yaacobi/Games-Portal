INSERT INTO words (text, difficulty_level)
VALUES
  ('camel', 'easy'),('koala', 'easy'),('ottercub', 'easy'),('sparrow', 'easy'),('turkey', 'easy'),('donkey', 'easy'),
  ('avocadoeasy', 'easy'),('mangoeasy', 'easy'),('papayaeasy', 'easy'),('guavaeasy', 'easy'),('pearlite', 'easy'),('lime', 'easy'),
  ('subwaycar', 'easy'),('sailboat', 'easy'),('tramcar', 'easy'),('minibus', 'easy'),('rowboat', 'easy'),('jet', 'easy'),
  ('sunbeam', 'easy'),('rainfall', 'easy'),('rainbow', 'easy'),('breeze', 'easy'),('mist', 'easy'),('drizzle', 'easy'),
  ('banjo', 'easy'),('clarinet', 'easy'),('ukulele', 'easy'),('melody', 'easy'),('chorus', 'easy'),('tempo', 'easy'),

  ('lynx', 'medium'),('meerkat', 'medium'),('gazelle', 'medium'),('antelope', 'medium'),('pelican', 'medium'),('seahorse', 'medium'),
  ('blackberry', 'medium'),('blueberry', 'medium'),('raspberry', 'medium'),('pineapple', 'medium'),('watermelon', 'medium'),('pomegranatex', 'medium'),
  ('hoverbike', 'medium'),('cablecar', 'medium'),('airship', 'medium'),('freighter', 'medium'),('motorcoach', 'medium'),('lifeboat', 'medium'),
  ('downpour', 'medium'),('humidityx', 'medium'),('heatwave', 'medium'),('forecast', 'medium'),('hailstorm', 'medium'),('overcast', 'medium'),
  ('accordion', 'medium'),('synthesizer', 'medium'),('metronome', 'medium'),('harmony', 'medium'),('orchestra', 'medium'),('amplifier', 'medium'),

  ('albatross', 'hard'),('woodpecker', 'hard'),('salamander', 'hard'),('hedgehog', 'hard'),('manatee', 'hard'),('ibex', 'hard'),
  ('clementine', 'hard'),('boysenberry', 'hard'),('elderberry', 'hard'),('huckleberry', 'hard'),('persimmon', 'hard'),('starfruit', 'hard'),
  ('supersonicjet', 'hard'),('icebreaker', 'hard'),('zeppelin', 'hard'),('hydrofoil', 'hard'),('autogyro', 'hard'),('funicularrail', 'hard'),
  ('thunderstorm', 'hard'),('barometric', 'hard'),('precipitation', 'hard'),('stratosphere', 'hard'),('monsoon', 'hard'),('atmospheric', 'hard'),
  ('vibraphone', 'hard'),('contrabass', 'hard'),('polyphony', 'hard'),('crescendo', 'hard'),('sonata', 'hard'),('improvisation', 'hard')
ON CONFLICT (text) DO NOTHING;

WITH links(word_text, category_slug) AS (
  VALUES
  ('camel','animals'),('koala','animals'),('ottercub','animals'),('sparrow','animals'),('turkey','animals'),('donkey','animals'),
  ('lynx','animals'),('meerkat','animals'),('gazelle','animals'),('antelope','animals'),('pelican','animals'),('seahorse','animals'),
  ('albatross','animals'),('woodpecker','animals'),('salamander','animals'),('hedgehog','animals'),('manatee','animals'),('ibex','animals'),

  ('avocadoeasy','fruits'),('mangoeasy','fruits'),('papayaeasy','fruits'),('guavaeasy','fruits'),('pearlite','fruits'),('lime','fruits'),
  ('blackberry','fruits'),('blueberry','fruits'),('raspberry','fruits'),('pineapple','fruits'),('watermelon','fruits'),('pomegranatex','fruits'),
  ('clementine','fruits'),('boysenberry','fruits'),('elderberry','fruits'),('huckleberry','fruits'),('persimmon','fruits'),('starfruit','fruits'),

  ('subwaycar','vehicles'),('sailboat','vehicles'),('tramcar','vehicles'),('minibus','vehicles'),('rowboat','vehicles'),('jet','vehicles'),
  ('hoverbike','vehicles'),('cablecar','vehicles'),('airship','vehicles'),('freighter','vehicles'),('motorcoach','vehicles'),('lifeboat','vehicles'),
  ('supersonicjet','vehicles'),('icebreaker','vehicles'),('zeppelin','vehicles'),('hydrofoil','vehicles'),('autogyro','vehicles'),('funicularrail','vehicles'),

  ('sunbeam','weather'),('rainfall','weather'),('rainbow','weather'),('breeze','weather'),('mist','weather'),('drizzle','weather'),
  ('downpour','weather'),('humidityx','weather'),('heatwave','weather'),('forecast','weather'),('hailstorm','weather'),('overcast','weather'),
  ('thunderstorm','weather'),('barometric','weather'),('precipitation','weather'),('stratosphere','weather'),('monsoon','weather'),('atmospheric','weather'),

  ('banjo','music'),('clarinet','music'),('ukulele','music'),('melody','music'),('chorus','music'),('tempo','music'),
  ('accordion','music'),('synthesizer','music'),('metronome','music'),('harmony','music'),('orchestra','music'),('amplifier','music'),
  ('vibraphone','music'),('contrabass','music'),('polyphony','music'),('crescendo','music'),('sonata','music'),('improvisation','music')
)
INSERT INTO word_category_links (word_id, category_id)
SELECT w.id, c.id
FROM links l
JOIN words w ON w.text = l.word_text
JOIN word_categories c ON c.slug = l.category_slug
ON CONFLICT DO NOTHING;

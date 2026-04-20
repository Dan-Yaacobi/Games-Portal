INSERT INTO words (text, difficulty_level)
VALUES
  ('ant', 'easy'),('bear', 'easy'),('fox', 'easy'),('wolf', 'easy'),('deer', 'easy'),('pig', 'easy'),('duckling', 'easy'),('panda', 'easy'),
  ('plum', 'easy'),('kiwi', 'easy'),('lemon', 'easy'),('fig', 'easy'),('date', 'easy'),('berry', 'easy'),('coconut', 'easy'),('cherry', 'easy'),
  ('jeep', 'easy'),('wagon', 'easy'),('canoe', 'easy'),('taxi', 'easy'),('metro', 'easy'),('rocket', 'easy'),('motorbike', 'easy'),('airplane', 'easy'),
  ('pan', 'easy'),('pot', 'easy'),('cup', 'easy'),('bowl', 'easy'),('knife', 'easy'),('desk', 'easy'),('paper', 'easy'),('ruler', 'easy'),
  ('storm', 'easy'),('snow', 'easy'),('hail', 'easy'),('thunder', 'easy'),('violin', 'easy'),('drum', 'easy'),('flute', 'easy'),('song', 'easy'),

  ('jackal', 'medium'),('badger', 'medium'),('buffalo', 'medium'),('panther', 'medium'),('zebra', 'medium'),('octopus', 'medium'),('walrus', 'medium'),('rhino', 'medium'),
  ('apricot', 'medium'),('guava', 'medium'),('lychee', 'medium'),('durian', 'medium'),('raisin', 'medium'),('cranberry', 'medium'),('nectarine', 'medium'),('tangerine', 'medium'),
  ('bulldozer', 'medium'),('helicopter', 'medium'),('glider', 'medium'),('pickup', 'medium'),('speedboat', 'medium'),('minivan', 'medium'),('streetcar', 'medium'),('ambulance', 'medium'),
  ('saucepan', 'medium'),('colander', 'medium'),('toaster', 'medium'),('freezer', 'medium'),('textbook', 'medium'),('whiteboard', 'medium'),('projector', 'medium'),('stapler', 'medium'),
  ('humidity', 'medium'),('blizzard', 'medium'),('sunrise', 'medium'),('sunset', 'medium'),('saxophone', 'medium'),('trumpet', 'medium'),('playlist', 'medium'),('megaphone', 'medium'),

  ('armadillo', 'hard'),('orangutan', 'hard'),('rhinoceros', 'hard'),('hippocampus', 'hard'),('chameleon', 'hard'),('porcupine', 'hard'),('platypus', 'hard'),('alligator', 'hard'),
  ('blackcurrant', 'hard'),('dragonfruit', 'hard'),('grapefruit', 'hard'),('passionfruit', 'hard'),('pistachio', 'hard'),('cauliflower', 'hard'),('asparagus', 'hard'),('cantaloupe', 'hard'),
  ('funicular', 'hard'),('catamaran', 'hard'),('spacecraft', 'hard'),('interceptor', 'hard'),('hovercraft', 'hard'),('locomotion', 'hard'),('autopilot', 'hard'),('monorail', 'hard'),
  ('electrolysis', 'hard'),('nanotechnology', 'hard'),('accelerometer', 'hard'),('oscilloscope', 'hard'),('geothermal', 'hard'),('seismograph', 'hard'),('biodiversity', 'hard'),('metallurgy', 'hard'),
  ('chancellor', 'hard'),('cartographer', 'hard'),('skyscrapers', 'hard'),('cathedral', 'hard'),('amphitheater', 'hard'),('constabulary', 'hard'),('archipelago', 'hard'),('oceanography', 'hard')
ON CONFLICT (text) DO NOTHING;

WITH links(word_text, category_slug) AS (
  VALUES
  ('ant','animals'),('bear','animals'),('fox','animals'),('wolf','animals'),('deer','animals'),('pig','animals'),('duckling','animals'),('panda','animals'),
  ('jackal','animals'),('badger','animals'),('buffalo','animals'),('panther','animals'),('zebra','animals'),('octopus','animals'),('walrus','animals'),('rhino','animals'),
  ('armadillo','animals'),('orangutan','animals'),('rhinoceros','animals'),('chameleon','animals'),('porcupine','animals'),('platypus','animals'),('alligator','animals'),

  ('plum','fruits'),('kiwi','fruits'),('lemon','fruits'),('fig','fruits'),('date','fruits'),('berry','fruits'),('coconut','fruits'),('cherry','fruits'),
  ('apricot','fruits'),('guava','fruits'),('lychee','fruits'),('raisin','fruits'),('cranberry','fruits'),('nectarine','fruits'),('tangerine','fruits'),
  ('blackcurrant','fruits'),('dragonfruit','fruits'),('grapefruit','fruits'),('passionfruit','fruits'),('cantaloupe','fruits'),

  ('jeep','vehicles'),('wagon','vehicles'),('canoe','vehicles'),('taxi','vehicles'),('metro','vehicles'),('rocket','vehicles'),('motorbike','vehicles'),('airplane','vehicles'),
  ('bulldozer','vehicles'),('helicopter','vehicles'),('glider','vehicles'),('pickup','vehicles'),('speedboat','vehicles'),('minivan','vehicles'),('streetcar','vehicles'),('ambulance','vehicles'),
  ('funicular','vehicles'),('catamaran','vehicles'),('spacecraft','vehicles'),('interceptor','vehicles'),('hovercraft','vehicles'),('monorail','vehicles'),

  ('pan','kitchen'),('pot','kitchen'),('cup','kitchen'),('bowl','kitchen'),('knife','kitchen'),('saucepan','kitchen'),('colander','kitchen'),('toaster','kitchen'),('freezer','kitchen'),
  ('cauliflower','kitchen'),('asparagus','kitchen'),('pistachio','kitchen'),

  ('desk','school'),('paper','school'),('ruler','school'),('textbook','school'),('whiteboard','school'),('projector','school'),('stapler','school'),

  ('storm','weather'),('snow','weather'),('hail','weather'),('thunder','weather'),('humidity','weather'),('blizzard','weather'),('sunrise','weather'),('sunset','weather'),

  ('violin','music'),('drum','music'),('flute','music'),('song','music'),('saxophone','music'),('trumpet','music'),('playlist','music'),('megaphone','music'),

  ('autopilot','technology'),('accelerometer','technology'),('oscilloscope','technology'),('nanotechnology','technology'),('electrolysis','technology'),

  ('archipelago','nature'),('biodiversity','nature'),('geothermal','nature'),('seismograph','nature'),('oceanography','nature'),

  ('chancellor','jobs'),('cartographer','jobs'),('constabulary','jobs'),

  ('skyscrapers','buildings'),('cathedral','buildings'),('amphitheater','buildings'),

  ('spacecraft','space'),('rocket','space'),('interceptor','space'),('archipelago','ocean'),('oceanography','ocean'),('catamaran','ocean'),

  ('shirt','clothing'),('jacket','clothing'),('gloves','clothing'),('sock','clothing'),('hat','clothing'),

  ('hammer','tools'),('wrench','tools'),('seismograph','science'),('metallurgy','science'),('nanotechnology','science'),

  ('tree','garden'),('leaf','garden'),('grass','garden'),('deer','nature'),('octopus','ocean')
)
INSERT INTO word_category_links (word_id, category_id)
SELECT w.id, c.id
FROM links l
JOIN words w ON w.text = l.word_text
JOIN word_categories c ON c.slug = l.category_slug
ON CONFLICT DO NOTHING;

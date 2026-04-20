INSERT INTO words (text, difficulty_level)
VALUES
  ('goose', 'easy'),('parrot', 'easy'),('whale', 'easy'),('seal', 'easy'),('lizard', 'easy'),('eagle', 'easy'),('pony', 'easy'),('rabbit', 'easy'),
  ('grapesweet', 'easy'),('pearfruit', 'easy'),('orangefruit', 'easy'),('melonfresh', 'easy'),('lemonzest', 'easy'),('applecrisp', 'easy'),('plumfresh', 'easy'),('kiwislice', 'easy'),
  ('sedan', 'easy'),('coupe', 'easy'),('ferryboat', 'easy'),('scoot', 'easy'),('bikecart', 'easy'),('roadtrain', 'easy'),('taxicab', 'easy'),('airliner', 'easy'),
  ('sunlight', 'easy'),('raincloud', 'easy'),('snowfall', 'easy'),('raindrop', 'easy'),('fog', 'easy'),('breezy', 'easy'),('stormy', 'easy'),('sunnyday', 'easy'),
  ('lyric', 'easy'),('rhythm', 'easy'),('beatbox', 'easy'),('musicnote', 'easy'),('singing', 'easy'),('tune', 'easy'),('choral', 'easy'),('band', 'easy'),

  ('cheetah', 'medium'),('buffalox', 'medium'),('gorilla', 'medium'),('alpaca', 'medium'),('jaguar', 'medium'),('penguinx', 'medium'),('stingray', 'medium'),('crocodile', 'medium'),
  ('mandarin', 'medium'),('grapeseed', 'medium'),('mulberry', 'medium'),('currant', 'medium'),('jackfruit', 'medium'),('pomelo', 'medium'),('longan', 'medium'),('olivefruit', 'medium'),
  ('roadster', 'medium'),('snowmobile', 'medium'),('motorboat', 'medium'),('freightcar', 'medium'),('shuttlebus', 'medium'),('seaplane', 'medium'),('heavylorry', 'medium'),('tramline', 'medium'),
  ('thunderclap', 'medium'),('dewpoint', 'medium'),('rainfront', 'medium'),('coldsnap', 'medium'),('warmfront', 'medium'),('gustfront', 'medium'),('rainmeter', 'medium'),('microclimate', 'medium'),
  ('harmonica', 'medium'),('turntable', 'medium'),('soundboard', 'medium'),('singerx', 'medium'),('composer', 'medium'),('bassline', 'medium'),('chord', 'medium'),('soundtrack', 'medium'),

  ('chimpanzeex', 'hard'),('axolotl', 'hard'),('pterodactyl', 'hard'),('rattlesnake', 'hard'),('orangecrown', 'hard'),('narwhal', 'hard'),('orangecat', 'hard'),('butterflyfish', 'hard'),
  ('bloodorange', 'hard'),('lingonberry', 'hard'),('gooseberry', 'hard'),('physalis', 'hard'),('blacksapote', 'hard'),('feijoa', 'hard'),('tamarillo', 'hard'),('mulberryjam', 'hard'),
  ('intercityrail', 'hard'),('maglevtrain', 'hard'),('amphibiouscar', 'hard'),('orbitercraft', 'hard'),('suborbitaljet', 'hard'),('gyroplane', 'hard'),('aircushioncraft', 'hard'),('hybridlocomotive', 'hard'),
  ('electrostorm', 'hard'),('barography', 'hard'),('isobaric', 'hard'),('anemometer', 'hard'),('cumulonimbus', 'hard'),('thermocline', 'hard'),('hydrometeor', 'hard'),('stratocumulus', 'hard'),
  ('counterpoint', 'hard'),('orchestration', 'hard'),('syncopation', 'hard'),('arpeggio', 'hard'),('polyrythm', 'hard'),('cantata', 'hard'),('vocalization', 'hard'),('harmonization', 'hard')
ON CONFLICT (text) DO NOTHING;

WITH links(word_text, category_slug) AS (
  VALUES
  ('goose','animals'),('parrot','animals'),('whale','animals'),('seal','animals'),('lizard','animals'),('eagle','animals'),('pony','animals'),('rabbit','animals'),
  ('cheetah','animals'),('buffalox','animals'),('gorilla','animals'),('alpaca','animals'),('jaguar','animals'),('penguinx','animals'),('stingray','animals'),('crocodile','animals'),
  ('chimpanzeex','animals'),('axolotl','animals'),('pterodactyl','animals'),('rattlesnake','animals'),('narwhal','animals'),('butterflyfish','animals'),

  ('grapesweet','fruits'),('pearfruit','fruits'),('orangefruit','fruits'),('melonfresh','fruits'),('lemonzest','fruits'),('applecrisp','fruits'),('plumfresh','fruits'),('kiwislice','fruits'),
  ('mandarin','fruits'),('grapeseed','fruits'),('mulberry','fruits'),('currant','fruits'),('jackfruit','fruits'),('pomelo','fruits'),('longan','fruits'),('olivefruit','fruits'),
  ('bloodorange','fruits'),('lingonberry','fruits'),('gooseberry','fruits'),('physalis','fruits'),('blacksapote','fruits'),('feijoa','fruits'),('tamarillo','fruits'),('mulberryjam','fruits'),

  ('sedan','vehicles'),('coupe','vehicles'),('ferryboat','vehicles'),('scoot','vehicles'),('bikecart','vehicles'),('roadtrain','vehicles'),('taxicab','vehicles'),('airliner','vehicles'),
  ('roadster','vehicles'),('snowmobile','vehicles'),('motorboat','vehicles'),('freightcar','vehicles'),('shuttlebus','vehicles'),('seaplane','vehicles'),('heavylorry','vehicles'),('tramline','vehicles'),
  ('intercityrail','vehicles'),('maglevtrain','vehicles'),('amphibiouscar','vehicles'),('orbitercraft','vehicles'),('suborbitaljet','vehicles'),('gyroplane','vehicles'),('aircushioncraft','vehicles'),('hybridlocomotive','vehicles'),

  ('sunlight','weather'),('raincloud','weather'),('snowfall','weather'),('raindrop','weather'),('fog','weather'),('breezy','weather'),('stormy','weather'),('sunnyday','weather'),
  ('thunderclap','weather'),('dewpoint','weather'),('rainfront','weather'),('coldsnap','weather'),('warmfront','weather'),('gustfront','weather'),('rainmeter','weather'),('microclimate','weather'),
  ('electrostorm','weather'),('barography','weather'),('isobaric','weather'),('anemometer','weather'),('cumulonimbus','weather'),('hydrometeor','weather'),('stratocumulus','weather'),

  ('lyric','music'),('rhythm','music'),('beatbox','music'),('musicnote','music'),('singing','music'),('tune','music'),('choral','music'),('band','music'),
  ('harmonica','music'),('turntable','music'),('soundboard','music'),('singerx','music'),('composer','music'),('bassline','music'),('chord','music'),('soundtrack','music'),
  ('counterpoint','music'),('orchestration','music'),('syncopation','music'),('arpeggio','music'),('polyrythm','music'),('cantata','music'),('vocalization','music'),('harmonization','music'),

  ('anemometer','science'),('thermocline','science'),('barography','science'),('hydrometeor','science'),('cumulonimbus','science'),('isobaric','science')
)
INSERT INTO word_category_links (word_id, category_id)
SELECT w.id, c.id
FROM links l
JOIN words w ON w.text = l.word_text
JOIN word_categories c ON c.slug = l.category_slug
ON CONFLICT DO NOTHING;

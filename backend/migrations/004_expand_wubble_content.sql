INSERT INTO word_categories (slug, label)
VALUES
  ('countries', 'countries'),
  ('cities', 'cities'),
  ('foods', 'foods'),
  ('ocean', 'ocean things'),
  ('clothing', 'clothing items'),
  ('tools', 'tools'),
  ('garden', 'garden things'),
  ('office', 'office things'),
  ('holiday', 'holiday things'),
  ('science', 'science things')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO words (text, difficulty_level)
VALUES
  ('duck', 'easy'),('frog', 'easy'),('mouse', 'easy'),('pear', 'easy'),('peach', 'easy'),
  ('melon', 'easy'),('truck', 'easy'),('van', 'easy'),('ship', 'easy'),('boat', 'easy'),
  ('hat', 'easy'),('shirt', 'easy'),('sock', 'easy'),('spoon', 'easy'),('fork', 'easy'),
  ('plate', 'easy'),('chair', 'easy'),('table', 'easy'),('lamp', 'easy'),('tree', 'easy'),
  ('leaf', 'easy'),('grass', 'easy'),('sand', 'easy'),('beach', 'easy'),('star', 'easy'),
  ('moon', 'easy'),('book', 'easy'),('pen', 'easy'),('clock', 'easy'),('phone', 'easy'),('canada', 'easy'),('japan', 'easy'),('brazil', 'easy'),

  ('otter', 'medium'),('falcon', 'medium'),('lemur', 'medium'),('mango', 'medium'),('papaya', 'medium'),
  ('tram', 'medium'),('ferry', 'medium'),('kayak', 'medium'),('jacket', 'medium'),('gloves', 'medium'),
  ('blender', 'medium'),('microwave', 'medium'),('compiler', 'medium'),('router', 'medium'),('server', 'medium'),
  ('volleyball', 'medium'),('stadium', 'medium'),('desert', 'medium'),('valley', 'medium'),('harbor', 'medium'),
  ('shovel', 'medium'),('hammer', 'medium'),('wrench', 'medium'),('invoice', 'medium'),('printer', 'medium'),
  ('holiday', 'medium'),('lantern', 'medium'),('canvas', 'medium'),('planet', 'medium'),('comet', 'medium'),('capital', 'medium'),('village', 'medium'),

  ('hippopotamus', 'hard'),('chimpanzee', 'hard'),('pomegranate', 'hard'),('artichoke', 'hard'),('locomotive', 'hard'),
  ('submarine', 'hard'),('metropolis', 'hard'),('constellation', 'hard'),('spacesuit', 'hard'),('headphones', 'hard'),('tokyo', 'hard'),('london', 'hard'),
  ('microphone', 'hard'),('instrumentation', 'hard'),('cryptography', 'hard'),('biotechnology', 'hard'),('microscope', 'hard'),
  ('observatory', 'hard'),('hemisphere', 'hard'),('earthquake', 'hard'),('waterfall', 'hard'),('hydroelectric', 'hard'),
  ('firefighter', 'hard'),('electrician', 'hard'),('choreography', 'hard'),('jurisdiction', 'hard'),('navigation', 'hard'),
  ('laboratorycoat', 'hard'),('thermodynamics', 'hard'),('ecosystem', 'hard'),('photosynthesis', 'hard'),('planetarium', 'hard')
ON CONFLICT (text) DO NOTHING;

WITH links(word_text, category_slug) AS (
  VALUES
  ('duck','animals'),('frog','animals'),('mouse','animals'),('otter','animals'),('falcon','animals'),('lemur','animals'),('hippopotamus','animals'),('chimpanzee','animals'),
  ('pear','fruits'),('peach','fruits'),('melon','fruits'),('mango','fruits'),('papaya','fruits'),('pomegranate','fruits'),
  ('truck','vehicles'),('van','vehicles'),('ship','vehicles'),('boat','vehicles'),('tram','vehicles'),('ferry','vehicles'),('kayak','vehicles'),('locomotive','vehicles'),('submarine','vehicles'),
  ('hat','clothing'),('shirt','clothing'),('sock','clothing'),('jacket','clothing'),('gloves','clothing'),('spacesuit','clothing'),('laboratorycoat','clothing'),
  ('spoon','kitchen'),('fork','kitchen'),('plate','kitchen'),('blender','kitchen'),('microwave','kitchen'),('artichoke','kitchen'),
  ('chair','office'),('table','office'),('lamp','office'),('book','office'),('pen','office'),('printer','office'),('invoice','office'),
  ('tree','nature'),('leaf','nature'),('grass','nature'),('desert','nature'),('valley','nature'),('waterfall','nature'),('ecosystem','nature'),
  ('sand','ocean'),('beach','ocean'),('harbor','ocean'),('ship','ocean'),('ferry','ocean'),('kayak','ocean'),
  ('star','space'),('moon','space'),('planet','space'),('comet','space'),('constellation','space'),('planetarium','space'),
  ('clock','technology'),('phone','technology'),('compiler','technology'),('router','technology'),('server','technology'),('cryptography','technology'),('navigation','technology'),
  ('volleyball','sports'),('stadium','sports'),('helmet','sports'),('racket','sports'),('basketball','sports'),
  ('shovel','tools'),('hammer','tools'),('wrench','tools'),('electrician','jobs'),('firefighter','jobs'),
  ('holiday','holiday'),('lantern','holiday'),('canvas','holiday'),
  ('canada','countries'),('japan','countries'),('brazil','countries'),
  ('observatory','science'),('microscope','science'),('biotechnology','science'),('thermodynamics','science'),('photosynthesis','science'),('hydroelectric','science'),
  ('metropolis','cities'),('jurisdiction','cities'),('capital','cities'),('village','cities'),('tokyo','cities'),('london','cities'),('planetarium','buildings'),('observatory','buildings'),
  ('duck','foods'),('pear','foods'),('peach','foods'),('melon','foods'),('artichoke','foods'),
  ('tree','garden'),('grass','garden'),('shovel','garden'),('leaf','garden')
)
INSERT INTO word_category_links (word_id, category_id)
SELECT w.id, c.id
FROM links l
JOIN words w ON w.text = l.word_text
JOIN word_categories c ON c.slug = l.category_slug
ON CONFLICT DO NOTHING;

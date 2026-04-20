import { query } from '../../db/pool.js';
import { MIN_CATEGORY_WORDS } from './wubble.config.js';

export async function getWubbleContent({ wordDifficulty }) {
  const result = await query(
    `SELECT
      w.id AS word_id,
      w.text AS word_text,
      w.difficulty_level,
      c.slug AS category_slug,
      c.label AS category_label
     FROM words w
     JOIN word_category_links l ON l.word_id = w.id
     JOIN word_categories c ON c.id = l.category_id
     WHERE w.difficulty_level = $1
     ORDER BY w.text ASC`,
    [wordDifficulty]
  );

  const wordsById = new Map();
  const categories = new Map();

  for (const row of result.rows) {
    if (!wordsById.has(row.word_id)) {
      wordsById.set(row.word_id, {
        wordId: row.word_id,
        wordText: row.word_text,
        categories: []
      });
    }

    wordsById.get(row.word_id).categories.push(row.category_slug);

    if (!categories.has(row.category_slug)) {
      categories.set(row.category_slug, {
        slug: row.category_slug,
        label: row.category_label,
        wordIds: []
      });
    }

    categories.get(row.category_slug).wordIds.push(row.word_id);
  }

  const categoryList = Array.from(categories.values()).filter((category) => category.wordIds.length >= MIN_CATEGORY_WORDS);

  return {
    words: Array.from(wordsById.values()),
    categories: categoryList
  };
}

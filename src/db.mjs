import path from 'path';
import { tmpdir } from 'os';
import { ClassicLevel } from 'classic-level';

const DB_LOCATION = path.join(tmpdir(), 'lvl');

console.log(`DATA @ ${DB_LOCATION}`);

const db = new ClassicLevel(DB_LOCATION);
const favorites = db.sublevel('favorites', { valueEncoding: 'json' });
const favoritesIndex = db.sublevel('favoritesIndex');

const maybeGet = async (sub, key) => {
  if (!key) return null;
  let val = null;
  try {
    val = await sub.get(key);
  } catch (e) {
    if (e.status !== 404) throw (e);
  };
  return val;
};

export const toggleFavorite = async (uid, article) => {
  const lookupId = [uid, encodeURI(article.url)].join(':');
  let favId = await maybeGet(favoritesIndex, lookupId);
  if (favId) {
    await db.batch([{
      type: 'del',
      sublevel: favorites,
      key: favId,
    }, {
      type: 'del',
      sublevel: favoritesIndex,
      key: lookupId,
    }]);
  } else {
    favId = [uid, Date.now()].join(':');
    await db.batch([{
      type: 'put',
      sublevel: favorites,
      key: favId,
      value: article,
    }, {
      type: 'put',
      sublevel: favoritesIndex,
      key: lookupId,
      value: favId,
    }]);
  }
};

export const getFavoritesByUser = async (uid, transform) => {
  const articles = [];
  const preface = uid + ':';
  for await (const [key, value] of favorites.iterator({ gte: preface })) {
    if (!key.startsWith(preface)) break;
    articles.push(transform ? transform(value) : value);
  }
  return articles;
};

const LOCAL_KEY = 'favoriteArticles';

const walkUntil = (el, predicate) => {
  do {
    if (predicate(el)) return el;
    el = el.parentNode;
  } while (el !== document.body);
}

const setLocal = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    localStorage.clear();
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const getOrSetLocal = (key, value) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    if (v) return v;
  } catch (_) {}
  setLocal(key, value);
  console.log(value)
  return value;
};

const container = document.getElementById('favorites');
const highlights = document.createElement('style');
document.body.appendChild(highlights);

const favorites = new Proxy(getOrSetLocal(LOCAL_KEY, {}), {
  set(t, p, v) {
    t[p] = v;
    setLocal(LOCAL_KEY, t);
    updateFavorites();
    return true;
  },
  deleteProperty(t, p) {
    delete t[p];
    setLocal(LOCAL_KEY, t);
    updateFavorites();
    return true;
  }
});

window.updateFavorites = () => {
  const selectors = [];
  const articles = [];
  Object.entries(favorites)
    .sort((a, b) => a[1].favoritedAt < b[1].favoritedAt ? 1 : -1)
    .forEach(([url, { html }]) => {
      selectors.push(`.card[href='${url}'] .icn`);
      articles.push(html);
    });
  if (container) container.innerHTML = articles.length ? articles.join('\n') : 'You have no favorites yet.';
  highlights.innerHTML = `${selectors.join(',')}{ opacity: 1; }`;
}

updateFavorites();

document.addEventListener('click', (evt) => {
  if (evt.target.dataset.favorite) {
    evt.preventDefault();
    const articleLink = walkUntil(evt.target, el => !!el.attributes.href);
    if (articleLink) {
      const url = articleLink.getAttribute('href');
      if (favorites[url]) delete favorites[url];
      else favorites[url] = { favoritedAt: Date.now(), html: articleLink.outerHTML };
    }
  }
});
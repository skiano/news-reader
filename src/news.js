/***********/
/* HELPERS */
/***********/

const tag = (tag, attr = {}, children = []) => {
  children = Array.isArray(children) ? children : [children];
  const elm = document.createElement(tag);
  for (let a in attr) {
    if (a.startsWith('on')) {
      elm.addEventListener(a.slice(2).toLowerCase(), attr[a])    
    } else {
      if (attr[a]) elm.setAttribute(a, attr[a]);
    }
  }
  children.forEach((c) => {
    if (!c) return;
    if (typeof c === 'string') {
      if (children.length) {
        const s = document.createElement('span');
        s.innerHTML = c;
        elm.appendChild(s);
      } else {
        elm.innerHTML = c;
      }
    } else {
      elm.appendChild(c);
    }
  });
  return elm;
};

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
  return value;
};

const MONTHS = 'Jan.Feb.Mar.Apr.May.Jun.Jul.Aug.Sep.Oct.Nov.Dec'.split('.');
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
};

/**************/
/* STATE MGMT */
/**************/

const initialState = {
  view: window.location.pathname,
  query: '',
  page: 1,
  total: 0,
  articles: [],
  totalResults: [],
  viewed: getOrSetLocal('viewed', {}),
  favorites: getOrSetLocal('favorites', {}),
};

const listeners = {};
const STATE = new Proxy(initialState, {
  get(target, p) {
    return target[p];
  },
  set(target, p, v) {
    if (target[p] !== v) {
      target[p] = v;
      if (listeners[p]) listeners[p].forEach(cb => cb(v)); 
    }
    return true;
  },
});

const subscribe = (prop, cb) => {
  if (!listeners[prop]) listeners[prop] = new Set();
  listeners[prop].add(cb);
  cb(STATE[prop]);
  return function unsubscribe () {
    listeners[prop].delete(cb);
  }
}

/***********/
/* ACTIONS */
/***********/

const toggleFavoriteArticle = (article) => {
  if (STATE.favorites[article.url]) {
    const copy = { ...STATE.favorites };
    delete copy[article.url];
    STATE.favorites = copy;
  } else {
    article.favoritedAt = Date.now(),
    STATE.favorites = {
      ...STATE.favorites,
      [article.url]: article,
    }
  }
}

const fetchHeadlines = async () => {
  const { query, page } = STATE;
  let url = query ? `/api/everything?language=en&q='${encodeURI(query)}'` : '/api/top-headlines?country=us';
  if (page) url += `&page=${page}`;
  const res = await fetch(url);
  const result = await res.json();
  STATE.articles = result.articles.map(({
    url,
    title,
    source,
    urlToImage,
    publishedAt,
    description,
  }) => {
    // remove the source from the title since we are rendering it in its own element
    if (title && title.indexOf(`- ${source.name}`) >= 0) title = title.slice(0, title.indexOf(`- ${source.name}`));
    return {
      url,
      title,
      source,
      urlToImage,
      publishedAt,
      description,
    }
  });
  STATE.totalResults = result.totalResults;
}

/**************/
/* COMPONENTS */
/**************/

const articleCard = (article) => {
  const { url, title, source, publishedAt, description, urlToImage } = article;

  const star = tag('a', {
    href: '#',
    class: 'icn icn--blackstar' + (STATE.favorites[url] ? '' : ' dim'),
  });

  return tag('li', {
    class: 'flexcol gap--sm card pointer',
    onclick(evt) {
      evt.preventDefault();
      if (evt.target === star) {
        star.classList.toggle('dim');
        toggleFavoriteArticle(article);
      } else {
        console.log('open', url.replace('//amp.', '//'));
      }
    },
  }, [
    tag('div', { class: 'flexrow space-between' }, [
      tag('div', { class: 'flexrow' }, [
        tag('h4', {}, source.name),
        tag('h5', {}, '&nbsp;•&nbsp;' + formatDate(publishedAt)),
      ]),
      star,
    ]),
    urlToImage && tag('img', { src: urlToImage, alt: title }),
    tag('h2', {}, title),
    tag('p', {}, description),
    tag('a', { class: 'hand', href: url }, '☞'),
  ]);
};

const articleSummary = (article) => {
  const { url, title, description, source, publishedAt, urlToImage } = article;
  const star = tag('a', {
    href: '#',
    class: 'icn icn--blackstar' + (STATE.favorites[url] ? '' : ' dim'),
  });

  return tag('li', {
    class: 'flexcol card gap--sm',
    onclick(evt) {
      evt.preventDefault();
      if (evt.target === star) {
        star.classList.toggle('dim');
        toggleFavoriteArticle(article);
      } else {
        console.log('open', url.replace('//amp.', '//'));
      }
    },
  }, [
    tag('div', { class: 'flexrow space-between' }, [
      tag('div', { class: 'flexrow' }, [
        tag('h4', {}, source.name),
        tag('h5', {}, '&nbsp;•&nbsp;' + formatDate(publishedAt)),
      ]),
      star,
    ]),
    tag('div', { class: '' }, [
      urlToImage && tag('div', {
        style: 'float: right; max-width: 32vw; width: 100%; margin: 0 0 10px 10px;'
      }, [
        tag('img', {
          src: urlToImage,
        alt: title,
        })
      ]),
      tag('h2', { class: 'grow', style: 'margin-bottom: 12px;' }, title),
      tag('p', {}, description),
    ]),
  ]);
}

const searchBar = tag('form', {
  class: 'flexrow align-stretch',
  onsubmit(evt) {
    evt.preventDefault();
    fetchHeadlines();
  }
}, [
  tag('input', {
    class: 'grow',
    type: 'search',
    oninput(evt) {
      STATE.query = evt.target.value;
    }
  }),
  tag('input', { class: 'btn', type: 'submit', value: 'Search' }),
]);

const articleList = () => {
  fetchHeadlines();
  const section = tag('section', { class: 'container dl' }, [
    searchBar,
  ]);
  let ul;
  subscribe('articles', (articles) => {
    if (ul) ul.remove();
    ul = tag('ul', { class: 'grid', style: 'margin: 30px 0;' }, articles.map(articleCard));
    section.appendChild(ul);
  });
  return section;
};

const favoriteList = () => {
  fetchHeadlines();
  const section = tag('section', { class: 'container' });
  let ul;
  subscribe('favorites', (favorites) => {
    if (ul) ul.remove();
    const cards = Object.values(favorites)
      .sort((a, b) => (a.favoritedAt || a.publishedAt) < (a.favoritedAt || b.publishedAt) ? 1 : -1)
      .map(articleSummary);
    ul = tag('ul', { class: 'flexcol gap--lg' }, cards);
    section.appendChild(ul);
  });
  return section;
};

const fastLink = (attr, children) => {
  return tag('a', {
    ...attr,
    onclick(evt) {
      evt.preventDefault();
      window.history.pushState(null, null, attr.href);
      STATE.view = attr.href;
    }
  }, children);
}

/***********************/
/* PUT IT ALL TOGETHER */
/***********************/

const articles = articleList();
const favorites = favoriteList();

window.addEventListener('popstate', () => {
  STATE.view = document.location.pathname;
});

subscribe('view', (view) => {
  if (view === '/favorites') {
    articles.style.display = 'none';
    favorites.style.display = 'block';
  } else {
    articles.style.display = 'block';
    favorites.style.display = 'none';
  }
});

subscribe('viewed', (viewed) => {
  setLocal('viewed', viewed);
});

subscribe('favorites', (favorites) => {
  setLocal('favorites', favorites);
});

document.body.appendChild(tag('main', { class: 'flexcol align-center gap--lg' }, [
  tag('header', { id: 'hat', class: 'container flexrow gap--md align-baseline' }, [
    tag('h3', { id: 'logo' }, 'News.'),
    fastLink({
      href: '/',
    }, [
      'Recent',
    ]),
    fastLink({
      href: '/favorites',
    }, [
      'Favorites',
    ]),
  ]),
  articles,
  favorites,
]));

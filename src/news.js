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

const MONTHS = 'Jan.Feb.Mar.Apr.May.Jun.Jul.Aug.Sep.Oct.Nov.Dec'.split('.');
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
};

/**************/
/* STATE MGMT */
/**************/

const bruteSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    localStorage.clear();
    localStorage.setItem(key, JSON.stringify(value));
  }
}

const getOrSet = (key, value) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    if (v) return v;
  } catch (_) {}
  bruteSet(key, value);
  return value;
}

const listeners = {};
const STATE = new Proxy({
  view: 'all',
  query: '',
  page: 1,
  total: 0,
  articles: [],
  totalResults: [],
  viewed: getOrSet('viewed', {}),
  favorites: getOrSet('favorites', {}),
}, {
  get(target, p) {
    return target[p];
  },
  set(target, p, v) {
    target[p] = v;
    if (listeners[p]) listeners[p].forEach(cb => cb(v));
    return target;
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

subscribe('viewed', (viewed) => { bruteSet('viewed', viewed); });
subscribe('favorites', (favorites) => { bruteSet('favorites', favorites); });

/***********/
/* ACTIONS */
/***********/

const toggleFavoriteArticle = (article) => {
  if (STATE.favorites[article.url]) {
    const copy = { ...STATE.favorites };
    delete copy[article.url];
    STATE.favorites = copy;
  } else {
    STATE.favorites = {
      ...STATE.favorites,
      [article.url]: article,
    }
  }
}

const fetchHeadlines = async () => {
  const { query, page } = STATE;
  let url = query ? `/api/everything?language=en&sortBy=publishedAt&q='${encodeURI(query)}'` : '/api/top-headlines?country=us';
  if (page) url += `&page=${page}`;
  const res = await fetch(url);
  const result = await res.json();
  STATE.articles = result.articles;
  STATE.totalResults = result.totalResults;
}

/**************/
/* COMPONENTS */
/**************/

const articleCard = ({
  url,
  title,
  source,
  urlToImage,
  publishedAt,
  description,
}) => {
  // remove the source from the title since we are rendering it in its own element
  if (title.indexOf(`- ${source.name}`) >= 0) title = title.slice(0, title.indexOf(`- ${source.name}`));

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
        toggleFavoriteArticle({
          url,
          title,
          source,
          urlToImage,
          publishedAt,
          description,
        });
      } else {
        console.log('open', url.replace('//amp.', '//'));
        const iframe = tag('iframe', { src: url.replace('//amp.', '//') }); // HACKTASTIC...
        MAIN.appendChild(iframe);
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

const articleList = () => {
  fetchHeadlines();
  const section = tag('section', { class: 'container' });
  let ul;
  subscribe('articles', (articles) => {
    if (ul) ul.remove();
    console.log(articles);
    ul = tag('ul', { class: 'grid' }, articles.map(articleCard));
    section.appendChild(ul);
  });
  return section;
};

const searchbar = tag('form', {
  class: 'flexrow',
  onsubmit(evt) {
    evt.preventDefault();
    fetchHeadlines();
  }
}, [
  tag('input', {
    type: 'search',
    oninput(evt) {
      STATE.query = evt.target.value;
    }
  }),
  tag('input', { type: 'submit', value: 'Search' }),
]);

/***********************/
/* PUT IT ALL TOGETHER */
/***********************/

const articles = articleList();

subscribe('query', (q) => { console.log(q)})

document.body.appendChild(tag('main', { class: 'flexcol align-center gap--lg' }, [
  tag('header', { id: 'hat', class: 'container' }, [
    tag('h3', { id: 'logo' }, 'News Reader.')
  ]),
  tag('div', { class: 'container flexrow gap--md' }, [
    searchbar
  ]),
  articles,
]));
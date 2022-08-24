import fs from 'fs';
import es from 'event-stream';
import http from 'http';
import https from 'https';
import cookie from 'cookie';
import JSONStream from 'JSONStream';
import { encode } from 'html-entities';
import { nanoid } from 'nanoid';
import { getFavoritesByUser, toggleFavorite } from './db.mjs';
import { _, toString, toStream } from 'genz';

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'be5922e28b9b4f7e8c1000041e936493';

const MONTHS = 'Jan.Feb.Mar.Apr.May.Jun.Jul.Aug.Sep.Oct.Nov.Dec'.split('.');
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
};

const css = fs.readFileSync('news.css').toString();

const ArticleCard = (article) => {
  let { url, title, source, publishedAt, description, urlToImage } = article;
  return _.a({ href: url, class: 'flexcol gap--sm card pointer' }, [
    _.div({ class: 'flexrow space-between' }, [
      _.div({ class: 'flexrow' }, [
        _.h4(source.name),
        _.h5('&nbsp;•&nbsp;' + formatDate(publishedAt)),
      ]),
      _.button({
        class: 'icn icn--blackstar',
        'data-favorite': encode(JSON.stringify(article)),
      }),
    ]),
    urlToImage && _.img({ src: urlToImage, alt: title }),
    _.h2({ class: 't2' }, title),
    _.p(encode(description)),
  ]);
};

const SearchBar = (ctx) => {
  return _.form({ class: 'flexrow', style: 'margin-bottom: 30px;', action: '/' },
    _.input({ name: 'q', type: 'search', placeholder: 'What’s your pleasure?', value: ctx.search.q || '', class: 'grow' }),
    _.input({ type: 'hidden', name: 'language', value: ctx.search.language || 'en' }),
    _.input({ type: 'submit', class: 'btn', value: 'Search' }),
  );
};

const Headlines = (ctx) => {
  const  { q, language } = ctx.search;
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'newsapi.org',
      path: q ? `/v2/everything?q=${encodeURI(q)}&language=${language}` : '/v2/top-headlines?country=us',
      headers: { 'X-Api-Key': API_KEY, 'User-Agent': 'nodejs' },
    }, (apiRes) => {
      const articleStream = apiRes
        .pipe(JSONStream.parse('articles.*'))
        .pipe(es.mapSync(function (article) {
          const { title, source } = article;
          if (title && title.indexOf(`- ${source.name}`) >= 0) {
            article.title = title.slice(0, title.indexOf(`- ${source.name}`));
          }
          delete article.content;
          return toString(ArticleCard(article));
        }));
      resolve(_.ul({ class: 'grid', style: 'margin-bottom: 50px;' },
        articleStream
      ));
    }).on('error', reject);
  });
}

const Page = (opt = {}, ...content) => {
  return _.html(
    _.head(
      _.title(opt.title || 'News.'),
      _.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
      _.style(css),
    ),
    _.body({ class: 'flexcol align-center gap--md'},
      _.header({ id: 'hat', class: 'container flexrow gap--md align-baseline space-between' }, [
        _.h3(_.a({ class: 't1', id: 'logo', href: '/' }, 'News.')),
        _.a({ href: '/favorites' }, 'My Favorites'),
      ]),
      _.main({ class: 'container'}, content),
    )
  );
}

const HandleFavorite = () => _.script({ type: 'module' }, `
  const getKey = (el, key) => el.dataset[key];
  document.addEventListener('click', (evt) => {
    const favorite = evt.target.dataset.favorite;
    if (favorite) {
      evt.preventDefault();
      fetch('/save?article=' + encodeURIComponent(favorite), {
        method: 'post',
        headers: { 'Content-Type': 'application/json' }
      })
    }
  });
`);

const Home = Page({ title: 'news' },
  HandleFavorite(),
  SearchBar,
  Headlines,
);

const Favorites = Page({ title: 'news' },
  HandleFavorite(),
  _.ul({ class: 'grid' },
    async (ctx) => {
      const favs = await getFavoritesByUser(ctx.uid);
      return favs.length
        ? favs.reverse().map(ArticleCard)
        : _.p('You have no favorites yet.');
    }
  )
);

const server = http.createServer(async (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const { uid } = cookie.parse(req.headers.cookie || '');
  const reqURL = new URL('http://foo.com' + req.url);
  const ctx = {
    uid,
    path: reqURL.pathname,
    search: {
      q: reqURL.searchParams.get('q') || '',
      language: reqURL.searchParams.get('language') || 'en',
    }
  };

  if (!uid) {
    res.setHeader('Set-Cookie', cookie.serialize('uid', nanoid(), {
      maxAge: 10 * 365 * 24 * 60 * 60
    }));
  };

  switch (true) {
    case req.method === 'POST' && reqURL.pathname === '/save':
      await toggleFavorite(uid, JSON.parse(reqURL.searchParams.get('article')));
      return res.end('ok');
    case ctx.path === '/favorites':
      return toStream(res, Favorites, ctx);
    case ctx.path === '/':
      return toStream(res, Home, ctx);
    default:
      res.statusCode = 404;
      return res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`serving at http://localhost:${PORT}`);
});

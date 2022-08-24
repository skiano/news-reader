import fs from 'fs';
import es from 'event-stream';
import http from 'http';
import https from 'https';
import JSONStream from 'JSONStream';
import { encode } from 'html-entities';
import { _, toString, toStream } from 'genz';

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'be5922e28b9b4f7e8c1000041e936493';
const JS_STRING = fs.readFileSync('src/client.js').toString();
const CSS_STRING = fs.readFileSync('src/client.css').toString();
const MONTHS = 'Jan.Feb.Mar.Apr.May.Jun.Jul.Aug.Sep.Oct.Nov.Dec'.split('.');

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
};

const ArticleCard = (article) => {
  let { url, title, source, publishedAt, description, urlToImage } = article;
  return _.a({
    href: url,
    class: 'flexcol gap--sm card pointer',
  }, [
    _.div({ class: 'flexrow space-between' }, [
      _.div({ class: 'flexrow' }, [
        _.h4(source.name),
        _.h5('&nbsp;•&nbsp;' + formatDate(publishedAt)),
      ]),
      _.button({
        class: 'icn icn--blackstar pointer',
        'data-favorite': true,
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
      _.style(CSS_STRING),
    ),
    _.body({ class: 'flexcol align-center gap--md', style: 'margin: 40px 0;' },
      _.script({ type: 'module' }, JS_STRING),
      _.header({ class: 'container flexrow gap--md align-baseline space-between' }, [
        _.h3(_.a({ class: 't1', id: 'logo', href: '/' }, 'News.')),
        _.a({ href: '/favorites' }, 'My Favorites'),
      ]),
      _.main({ class: 'container'}, content),
    )
  );
}

const Home = Page({ title: 'news' },
  SearchBar,
  Headlines,
);

const Favorites = Page({ title: 'news' },
  _.ul({ id: 'favorites', class: 'grid' }),
);

http.createServer(async (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const reqURL = new URL('http://foo.com' + req.url);
  const ctx = {
    path: reqURL.pathname,
    search: {
      q: reqURL.searchParams.get('q') || '',
      language: reqURL.searchParams.get('language') || 'en',
    }
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
}).listen(PORT, () => {
  console.log(`serving at http://localhost:${PORT}`);
});

const API_KEY = 'be5922e28b9b4f7e8c1000041e936493';
const MAIN = document.getElementById('app');
const MONTHS = 'Jan.Feb.Mar.Apr.May.Jun.Jul.Aug.Sep.Oct.Nov.Dec'.split('.');

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

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
};

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

/********/
/* DATA */
/********/

fetch(`https://newsapi.org/v2/everything?language=en`, {
  method: "GET",
  withCredentials: true,
  headers: {
    "X-Api-Key": API_KEY,
    "Content-Type": "application/json"
  }
}).then(async (res) => {
  const json = await res.json();
  console.log(json);
})

/*********/
/* STATE */
/*********/

const trackMap = (mapName) => {
  return new Proxy(getOrSet(mapName, {}), {
    get(target, p) {
      return target[p]; 
    },
    set(target, p, v) {
      target[p] = v;
      bruteSet(mapName, target);
      return target;
    },
    deleteProperty(target, p) {
      if (p in target) {
        delete target[p];
        bruteSet(mapName, target);
      }
      return target;
    },
  });
}

const favoriteArticles = trackMap('favorites');
const viewedArticles = trackMap('viewed');

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
    class: 'icn icn--blackstar' + (favoriteArticles[url] ? '' : ' dim'),
  });

  return tag('li', {
    class: 'flexcol gap--sm card pointer',
    onclick(evt) {
      evt.preventDefault();
      if (evt.target === star) {
        if (favoriteArticles[url]) {
          delete favoriteArticles[url];
          star.classList.add('dim');
        } else {
          favoriteArticles[url] = {
            url,
            title,
            source,
            urlToImage,
            publishedAt,
            description,
          };
          star.classList.remove('dim');
        }
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

const articleList = (articles) => {
  return tag('ul', { class: 'grid' }, articles.map(articleCard));
};

const exampleHeadlines = {"status":"ok","totalResults":38,"articles":[{"source":{"id":null,"name":"The Guardian"},"author":"Guardian staff reporter","title":"Mexico's ex-attorney general arrested over disappearance of 43 students in 2014 - The Guardian","description":"Jesús Murillo held on charges of forced disappearance, torture and obstruction of justice in notorious Guerrero case","url":"https://amp.theguardian.com/world/2022/aug/20/mexicos-ex-attorney-general-arrested-over-disappearance-of-43-students-in-2014","urlToImage":null,"publishedAt":"2022-08-20T03:30:00Z","content":"MexicoJesús Murillo held on charges of forced disappearance, torture and obstruction of justice in notorious Guerrero case\r\nSat 20 Aug 2022 04.30 BST\r\nMexicos former attorney general has been arreste… [+3974 chars]"},{"source":{"id":null,"name":"CNBC"},"author":"Lora Kolodny","title":"YouTube removes video by Tesla investors using kids in FSD Beta test - CNBC","description":"The tests were to determine if a slow-moving Tesla equipped with the company's latest driver assistance systems would automatically avoid pedestrians.","url":"https://www.cnbc.com/2022/08/19/youtube-removes-video-by-tesla-investors-using-kids-in-fsd-beta-test.html","urlToImage":"https://image.cnbcfm.com/api/v1/image/104565323-tesla.jpg?v=1529475576&w=1920&h=1080","publishedAt":"2022-08-20T01:50:00Z","content":"YouTube has removed a pair of videos from its platform which showed Tesla drivers conducting amateur vehicle safety tests using their own children in place of mannequins in the road or the driveway.\r… [+4950 chars]"},{"source":{"id":"reuters","name":"Reuters"},"author":null,"title":"Islamic State militant gets life in U.S. prison over killing of American hostages - Reuters","description":"A U.S. federal judge on Friday sentenced a member of an Islamic State cell known as \"The Beatles\" to life in prison for involvement in a hostage-taking plot that led to the killings of American journalists and aid workers in Syria.","url":"https://www.reuters.com/legal/islamic-state-cell-member-faces-us-sentencing-beheadings-2022-08-19/","urlToImage":"https://www.reuters.com/resizer/sumCZWRUt9voUTv5uN7uhy2Y2zQ=/1200x628/smart/filters:quality(80)/cloudfront-us-east-2.images.arcpublishing.com/reuters/MGH2N2FDXNJHJI72J4J4KHTSOE.jpg","publishedAt":"2022-08-20T00:48:00Z","content":"ALEXANDRIA, Va., Aug 19 (Reuters) - A U.S. federal judge on Friday sentenced a member of an Islamic State cell known as \"The Beatles\" to life in prison for involvement in a hostage-taking plot that l… [+4221 chars]"},{"source":{"id":"the-wall-street-journal","name":"The Wall Street Journal"},"author":"Benoît Morenne and Ryan Dezember","title":"Warren Buffett's Berkshire Hathaway Cleared to Buy as Much as Half of Occidental's Shares - The Wall Street Journal","description":"Berkshire Hathaway received regulatory approval to buy as much as 50% of the oil producer’s stock following Warren Buffett’s rapid acquisition of Occidental shares this year.","url":"https://www.wsj.com/articles/warren-buffetts-berkshire-hathaway-moves-to-buy-as-much-as-half-of-occidentals-shares-11660947773","urlToImage":"https://images.wsj.net/im-607737/social","publishedAt":"2022-08-20T00:42:00Z","content":null},{"source":{"id":null,"name":"CNBC"},"author":"Natasha Turak, Amanda Macias","title":"Zelenskyy warns world is on 'verge of nuclear disaster'; More explosions reported at Russian military sites - CNBC","description":"The international community is increasingly worried about the risk of a catastrophe at the nuclear power plant, which is Europe's largest.","url":"https://www.cnbc.com/2022/08/19/russia-ukraine-live-updates.html","urlToImage":"https://image.cnbcfm.com/api/v1/image/107105617-1660802200233-gettyimages-1242554586-AFP_32GN4A7.jpeg?v=1660802778&w=1920&h=1080","publishedAt":"2022-08-20T00:13:00Z","content":"Explosions and fires have been reported at military facilities in Russia and the territory it occupies in Ukraine, suggesting more sabotage attacks far into enemy lines. Ukraine has not publicly take… [+1080 chars]"},{"source":{"id":"the-washington-post","name":"The Washington Post"},"author":"Samantha Chery","title":"HBO Max removes nearly 200 episodes of 'Sesame Street' - The Washington Post","description":"","url":"https://www.washingtonpost.com/arts-entertainment/2022/08/19/hbo-max-removes-nearly-200-episodes-sesame-street/","urlToImage":"https://www.washingtonpost.com/wp-apps/imrs.php?src=https://arc-anglerfish-washpost-prod-washpost.s3.amazonaws.com/public/7WCTGAWILVBB7FCV5HJFEVC4UM.jpg&w=1440","publishedAt":"2022-08-20T00:11:48Z","content":"Comment on this story\r\nIts not a sunny day for HBO Max, which has caused social media uproar for removing almost 200 older episodes of the beloved kids show Sesame Street from its streaming service.\r… [+3325 chars]"},{"source":{"id":null,"name":"YouTube"},"author":null,"title":"Lindsey Graham loses new bid to avoid grand jury testimony - CNN","description":"US District Judge Leigh Martin May won’t put on hold her ruling that Sen. Lindsey Graham (R-SC) must appear before the Fulton County special grand jury that’...","url":"https://www.youtube.com/watch?v=MwDR9W8GQMI","urlToImage":"https://i.ytimg.com/vi/MwDR9W8GQMI/hqdefault.jpg","publishedAt":"2022-08-19T22:59:44Z","content":null},{"source":{"id":null,"name":"Page Six"},"author":"Evan Real","title":"Matt Damon, wife land in Georgia for BFF Ben Affleck and Jennifer Lopez's wedding - Page Six","description":"Damon and his wife, Luciana Barroso, arrived in Georgia on Friday ahead of his longtime friend’s wedding. They were snapped in an airfield near the venue.","url":"https://pagesix.com/2022/08/19/matt-damon-lands-in-georgia-for-ben-affleck-jennifer-lopezs-wedding/","urlToImage":"https://pagesix.com/wp-content/uploads/sites/3/2022/08/matt-damon-ben-affleck-wedding.jpg?quality=75&strip=all&w=1200","publishedAt":"2022-08-19T22:59:00Z","content":"Matt Damon and his wife, Luciana Barroso, arrived in Georgia on Friday ahead of Ben Affleck and Jennifer Lopezs wedding. \r\nIn photos exclusively obtained by Page Six, paparazzi caught the couple who … [+3010 chars]"},{"source":{"id":null,"name":"Chicago Tribune"},"author":"Jason Meisner, Megan Crepeau","title":"R. Kelly jury watches graphic video clips allegedly showing singer having sex with young teen - Chicago Tribune","description":"Jurors in R. Kelly’s federal trial watched graphic clips of three separate videos allegedly showing the R&B superstar sexually assaulting his goddaughter in the late 1990s, when she was as young as 14.","url":"https://www.chicagotribune.com/news/criminal-justice/ct-r-kelly-chicago-federal-trial-day-5-20220819-xvlw2h6iergybbjxmmisogzbii-story.html","urlToImage":"https://www.chicagotribune.com/resizer/HxeG5Npq6hXG7B3hbDWOnTPc9A0=/1200x630/filters:format(jpg):quality(70)/cloudfront-us-east-1.images.arcpublishing.com/tronc/Z6YCVX5UBVBYTC5F5FXZXQH5ZY.jpg","publishedAt":"2022-08-19T22:55:00Z","content":"Jurors in R. Kellys federal trial watched graphic clips Friday of three separate videos allegedly showing the R&amp;B superstar sexually assaulting his young goddaughter in the late 1990s.\r\nWhile the… [+7899 chars]"},{"source":{"id":null,"name":"New York Times"},"author":"Ken Belson","title":"Deshaun Watson’s Apology Undercuts the N.F.L.’s Message - The New York Times","description":"The league has looked for contrition in determining its discipline of players accused of conduct violations. Deshaun Watson’s insistence that he did nothing wrong undermined its attempt at rehabbing his image.","url":"https://www.nytimes.com/2022/08/19/sports/football/deshaun-watson-apology-nfl-suspension.html","urlToImage":"https://static01.nyt.com/images/2022/08/19/multimedia/19onpro-watson-1/19onpro-watson-1-facebookJumbo.jpg","publishedAt":"2022-08-19T22:44:28Z","content":"Balsam said that the owners, in their rush to sign Watson, undermined Goodells pursuit of an indefinite suspension, and until that dynamic changes, the league will be constrained in its discipline of… [+1280 chars]"},{"source":{"id":null,"name":"CBS Sports"},"author":"","title":"NFL preseason Week 2 scores, highlights, updates: Packers rookie Romeo Doubs continues to impress vs. Saints - CBS Sports","description":"All the best highlights from Week 2 of the preseason are right here","url":"https://www.cbssports.com/nfl/news/nfl-preseason-week-2-scores-highlights-updates-saints-first-round-wr-chris-olave-scores-first-career-td/","urlToImage":"https://sportshub.cbsistatic.com/i/r/2022/08/20/ff1f9c94-9704-469d-bdf7-91c728dc35e7/thumbnail/1200x675/f322510936c1af52bce3bc64261eb20c/chris-olave.jpg","publishedAt":"2022-08-19T22:42:45Z","content":"The NFL preseason has reached the midway point with Week 2, which serves as the de facto \"dress rehearsal\" for starters to prepare for the beginning of the regular season -- which is just three weeks… [+4701 chars]"},{"source":{"id":null,"name":"New York Times"},"author":"Aishvarya Kavi","title":"Lawmakers Demand Social Media Firms Address Threats to Law Enforcement - The New York Times","description":"The Democrats who lead two House panels also expressed concern about “reckless statements” from Republicans after a surge in online threats following the F.B.I. search of Mar-a-Lago.","url":"https://www.nytimes.com/2022/08/19/us/politics/social-media-threats-fbi-trump.html","urlToImage":"https://static01.nyt.com/images/2022/08/19/us/politics/19dc-threats-1/merlin_211471002_b7a46f0a-459f-436d-a5be-6c1461e5274f-facebookJumbo.jpg","publishedAt":"2022-08-19T22:41:52Z","content":"The lawmakers letters specifically cited comments from Representative Kevin McCarthy of California, the Republican leader, accusing the Justice Department of being weaponized against Mr. Trump, and i… [+1591 chars]"},{"source":{"id":null,"name":"9to5google.com"},"author":"Abner Li","title":"Google posts additional instructions for Pixel 6 owners that flashed Android 13 - 9to5Google","description":"In addressing that Pixel 6 vulnerability, another problem might arise and Google has released instructions if you flashed Android 13...","url":"https://9to5google.com/2022/08/19/android-13-flashing-pixel-6/","urlToImage":"https://i0.wp.com/9to5google.com/wp-content/uploads/sites/4/2022/08/Android-13-post-launch-logo-6.jpg?resize=1200%2C628&quality=82&strip=all&ssl=1","publishedAt":"2022-08-19T22:39:00Z","content":"With Android 13, Google made it so that the Pixel 6, 6 Pro, and 6a cannot reinstall Android 12 in order to address a security issue. In addressing that vulnerability, another problem might arise, and… [+3235 chars]"},{"source":{"id":"cnn","name":"CNN"},"author":"Justin Gamble and Virginia Langmaid, CNN","title":"Black couple sues after they say home valuation rises nearly $300,000 when shown by White colleague - CNN","description":"A Maryland couple has sued a local real estate appraiser and an online mortgage loan provider, alleging that the housing appraisal they received was unfairly low due to their race, in violation of the Fair Housing Act, after a second appraisal returned a resu…","url":"https://www.cnn.com/2022/08/19/us/black-couple-home-appraisal-lawsuit-reaj/index.html","urlToImage":"https://cdn.cnn.com/cnnnext/dam/assets/220819150445-maryland-black-couple-home-valuation-racial-discrimination-lawsuit-super-tease.jpg","publishedAt":"2022-08-19T22:12:00Z","content":"(CNN)A Maryland couple has sued a local real estate appraiser and an online mortgage loan provider, alleging that the housing appraisal they received was unfairly low due to their race, in violation … [+6062 chars]"},{"source":{"id":null,"name":"KABC-TV"},"author":null,"title":"USC student Jake Freeman makes $110 million selling Bed Bath & Beyond meme stock before it sank 40.5% - KABC-TV","description":"A 20-year-old student at the University of Southern California took a gamble and it paid off big.","url":"https://abc7.com/bed-bath-and-beyond-usc-student-sells-meme-stock-jake-freeman-university-of-southern-california/12143538/","urlToImage":"https://cdn.abcotvs.com/dip/images/6039869_032220-cc-ap-bedbathandbeyond-img.jpg?w=1600","publishedAt":"2022-08-19T22:01:30Z","content":"LOS ANGELES (KABC) -- A 20-year-old student at the University of Southern California took a gamble and it paid off big.\r\nAccording to reports, Jake Freeman, a math and economics major at USC, netted … [+667 chars]"},{"source":{"id":"the-washington-post","name":"The Washington Post"},"author":"Frances Stead Sellers","title":"New study suggests covid increases risks of brain disorders - The Washington Post","description":"The analysis found that people were at increased risk for dementia, epilepsy, psychosis and brain fog for about two years after contracting covid.","url":"https://www.washingtonpost.com/health/2022/08/19/long-covid-brain-effects/","urlToImage":"https://www.washingtonpost.com/wp-apps/imrs.php?src=https://arc-anglerfish-washpost-prod-washpost.s3.amazonaws.com/public/KPR4HDUVQQI6ZOZROT6ANQFDUU.jpg&w=1440","publishedAt":"2022-08-19T21:51:58Z","content":"Comment on this story\r\nA study published this week in the journal Lancet Psychiatry showed increased risks of some brain disorders two years after infection with the coronavirus, shedding new light o… [+5949 chars]"},{"source":{"id":null,"name":"Hollywood Reporter"},"author":"Abbey White","title":"Kevin Feige Confirmed Details of How Steve Rogers’ Captain America Lost His Virginity for ‘She-Hulk’ - Hollywood Reporter","description":"Logo text Kevin Feige knew exactly when and who Captain America lost his virginity to, according to She-Hulk showrunner Jessica Gao. In the debut episode of She-Hulk: Attorney at Law, cousins Jennifer Walters (Tatiana Maslany) and Bruce Banner (Mark Ruffalo) …","url":"https://www.hollywoodreporter.com/tv/tv-news/captain-america-virgin-kevin-feige-she-hulk-1235202554/","urlToImage":"https://www.hollywoodreporter.com/wp-content/uploads/2022/08/MCDCAAM_EC067.jpg?w=1024","publishedAt":"2022-08-19T21:43:13Z","content":"Kevin Feige knew exactly when and who Captain America lost his virginity to, according to She-Hulk showrunner Jessica Gao. \r\nIn the debut episode of She-Hulk: Attorney at Law, cousins Jennifer Walter… [+3139 chars]"},{"source":{"id":"reuters","name":"Reuters"},"author":null,"title":"Nord Stream 1 pipeline to shut for three days in latest fuel blow to Europe - Reuters","description":"Russia will halt natural gas supplies to Europe for three days at the end of the month via its main pipeline into the region, state energy giant Gazprom <a href=\"https://www.reuters.com/companies/GAZP.MM\" target=\"_blank\">(GAZP.MM)</a> said on Friday, piling p…","url":"https://www.reuters.com/business/energy/gazprom-says-nord-stream-1-pipeline-shut-three-days-end-aug-2022-08-19/","urlToImage":"https://www.reuters.com/resizer/x1dzd4NB89xLs5QtT1lDtK0qz8Y=/1200x628/smart/filters:quality(80)/cloudfront-us-east-2.images.arcpublishing.com/reuters/NYJIX76MKVKJFFXCHX6FGD6RLI.jpg","publishedAt":"2022-08-19T21:39:00Z","content":"FRANKFURT/BERLIN, Aug 19 (Reuters) - Russia will halt natural gas supplies to Europe for three days at the end of the month via its main pipeline into the region, state energy giant Gazprom (GAZP.MM)… [+4331 chars]"},{"source":{"id":"google-news","name":"Google News"},"author":null,"title":"Five things to know about Weisselberg's guilty plea - The Hill","description":null,"url":"https://news.google.com/__i/rss/rd/articles/CBMiaGh0dHBzOi8vdGhlaGlsbC5jb20vcmVndWxhdGlvbi9jb3VydC1iYXR0bGVzLzM2MDg1NDUtZml2ZS10aGluZ3MtdG8ta25vdy1hYm91dC13ZWlzc2VsYmVyZ3MtZ3VpbHR5LXBsZWEv0gEA?oc=5","urlToImage":null,"publishedAt":"2022-08-19T21:23:00Z","content":null},{"source":{"id":"the-washington-post","name":"The Washington Post"},"author":"Christian Davenport","title":"NASA reveals where it wants the next Americans to land on the moon - The Washington Post","description":"The 13 regions at the moon’s South Pole are a long way from where Neil Armstrong explored.","url":"https://www.washingtonpost.com/technology/2022/08/19/nasa-moon-landing-spots-artemis/","urlToImage":"https://www.washingtonpost.com/wp-apps/imrs.php?src=https://arc-anglerfish-washpost-prod-washpost.s3.amazonaws.com/public/ZHVX5S4SCRHZZMNYYREMXOHBXI.jpeg&w=1440","publishedAt":"2022-08-19T20:10:01Z","content":"Comment on this story\r\nNASA has yet to launch the rocket that would carry astronauts to the moon, and it hasnt yet selected the crew that would explore the lunar surface as part of its Artemis progra… [+4501 chars]"}]}

MAIN.appendChild(
  tag('section', { class: 'container' }, [
    articleList(exampleHeadlines.articles)
  ]),
);
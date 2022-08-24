# News App

Sample app using [NewsAPI](https://newsapi.org/).

## Setup

```bash
$ npm i
$ npm start

# open http://localhost:3000/
```

## Development

```bash
$ nodemon src/app.mjs -e mjs,js,css # if you have nodemon installed
```

## Architecture

There is a real tradeoff when starting a project like this. If you first decide that having a front-end means using a popular framework (e.g. react or vue), you can get started very quickly, but the downside is locking yourself into a whole series of unfortunate commitments before you have the first clue what you are building. Consider how another early question (do I want server-side rendering?) throws a wrench into things. SSR with any popular client-side framework is non-trivial. Yes, you can use boilerplates, but choosing which one invariably limits your future choices. Before you are up and running, you have committed to many, many dependencies which are unlikely to disappear as your project evolves.

Alternatively, you can embrace a minimalist/incremental approach, where you opt for the least binding and most disposable solutions to the problems right in front of you. That is what I wanted to experiment with in this project.

The result is idiosyncratic, but it challenged me to consider what a MVP can actually be. And while it may not be “maintainable” in the sense that most developers will be familiar with its architecture, I think the fact that it is so tiny means it would be easy to evolve going forward.

There are three files, no build tools, and very few dependencies. The app is able to send bytes to the client before it is done requesting data from NewsAPI, and the solution for storing favorite articles is just about the least abstract solution I could come up with. The next thing I would enchance would be error handling.

If this were a real product and I were on a team, I probably would not opt for this direction, but I think it was worth trying!

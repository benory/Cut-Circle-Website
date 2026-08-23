# Cut Circle website

This repository contains the website for [Cut Circle](https://cutcircle.org/), a vocal ensemble that brings Renaissance music to life through performances, recordings, research, and educational projects. Founded in 2003 and directed by Jesse Rodin, Cut Circle specializes in the music of the long fifteenth century, including works by Guillaume Du Fay, Johannes Ockeghem, Josquin des Prez, and their contemporaries.

The site presents the ensemble's artists, recordings, videos, performances, reviews, auditions, and Community Feasting Project. It also connects visitors with scores from the [Josquin Research Project](https://www.josqu.in/repertoire/?texted=true).

## About this repository

The website is built with [Jekyll](https://jekyllrb.com/). It uses Markdown and YAML front matter for content, Liquid templates for page rendering, and static CSS and JavaScript. Public URLs from the previous WordPress site are preserved where practical.

## Local development

Install Ruby, Bundler, and the project dependencies, then start the local server:

```sh
bundle install
bundle exec jekyll serve
```

The site will be available at <http://127.0.0.1:4000/>. Jekyll rebuilds it as source files change.

## Project structure

- `_artists/` — current artist biographies and profile metadata
- `_recordings/` — albums and individual recording pages
- `_events/` — concerts, workshops, and other events
- `_videos/` — video features and performance pages
- `_reviews/` — press quotations and reviews
- `_feasting/` — Community Feasting Project contributions
- `_data/` — structured site-wide data, including navigation and former artists
- `_layouts/` — page templates for each content type
- `_includes/` — reusable interface components
- `assets/` — images, audio, stylesheets, JavaScript, and fonts
- `legacy/` — compatibility pages for older public URLs
- `script/check_site.py` — checks generated pages for broken local references and basic structural issues

Top-level Markdown files define the principal pages and collection archives. Collection URLs and defaults are configured in `_config.yml`.

## Updating content

Create or edit the Markdown file in the relevant collection. Each file begins with YAML front matter containing fields such as `title`, `permalink`, `image`, and media or relationship data used by its layout. Follow an existing item of the same type when adding a page.

Store public media in the appropriate `assets/` subdirectory and use root-relative paths such as `/assets/images/example.jpg`. Former artists belong in `_data/former_artists.yml`; only current artists have individual profile pages.

After changing navigation, collection settings, or filenames, check that existing public permalinks still resolve.

## Verification

Before publishing, build and check the site:

```sh
bundle exec jekyll build
python3 script/check_site.py
node --check assets/js/site.js
```

The generated site is written to `_site/`.

## Deployment

This repository is ready to be deployed as a static Jekyll site. The production workflow should build the site with `bundle exec jekyll build` and publish `_site/`. Hosting or GitHub Pages configuration should be documented here once it is selected and added to the repository.

## External services and private data

Contact, mailing-list signup, and donations require separately configured service providers. Until those integrations are selected, the site uses clearly labeled email-based contact and subscription fallbacks and does not attempt to process donations or authenticate donors.

Do not commit the WordPress export, donor records, credentials, or other private data. Only public website content and media belong in this repository.

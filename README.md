# Cut Circle

Cut Circle is an award-winning vocal ensemble directed by [Jesse Rodin](https://benory.github.io/Cut-Circle-Website/artist/jesse-rodin/). Founded in 2003, Cut Circle specializes in music of the long fifteenth century—Guillaume Du Fay, Johannes Okeghem, Josquin des Prez, and their contemporaries. The ensemble is the recipient of the Noah Greenberg Award, which recognizes outstanding contributions to historical performing practices (American Musicological Society); the Prix Olivier Messiaen (France); Editor’s Choice (*Gramophone*, UK); and a *Diapason d’Or* (France).

As a 501(c)(3) non-profit organization, Cut Circle publishes recordings, gives concerts and lecture-recitals, and organizes workshops, masterclasses, and musical feasts. The ensemble performs internationally, with recent or upcoming appearances in the United States at the San Francisco Early Music Society and Stanford Live, and in Europe for the Fondazione Guido d’Arezzo (Arezzo, Italy), the FloReMus Festival (Florence, Italy), the Early Music Season (The Netherlands), the Tage Alter Musik (Regensburg, Germany), Laus Polyphoniae (Antwerp, Belgium), and Musica Sacra (Maastricht, The Netherlands).

The ensemble’s latest release is the second disc in a cycle devoted to the complete works of Josquin. Cut Circle records for the Belgian label [Musique en Wallonie](https://www.musiwall.uliege.be/).

## About this repository

This repository contains the [Cut Circle website](https://cutcircle.org/), presenting the ensemble’s artists, recordings, videos, performances, reviews, auditions, and Community Feasting Project. It also connects visitors with scores from the [Josquin Research Project](https://www.josqu.in/repertoire/?texted=true).

The website is built with [Jekyll](https://jekyllrb.com/). It uses Markdown and YAML front matter for content, Liquid templates for page rendering, and static CSS and JavaScript. Public URLs from the previous WordPress site are preserved where practical.

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

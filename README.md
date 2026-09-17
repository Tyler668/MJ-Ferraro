# Paintings by Peg

Static site with no build step: plain HTML, CSS and JS. To preview locally:

```
python tools/serve.py
```

That serves the site at http://localhost:8765 with caching turned off, so edits show up on a
plain reload. After changing CSS or JS, run `python tools/bump.py` to re-stamp the `?v=`
version on the asset links; that also stops browsers serving stale files after a deploy.

## Editing content
Everything lives in **`js/data.js`**:
- `SITE`: name, email, phone, Instagram/Facebook handles, region (**placeholders now**)
- `ROOMS`: the four gallery groupings
- `WORKS`: every painting (title, size in inches, medium, room, `available`/`sold`, description)
- `PETS`, `KEEPSAKES`, `PASTA`: commissions and party photos

To mark a painting sold, change `status: "available"` to `status: "sold"`. It moves into the Sold filter and gets a red dot.

Other placeholders are marked with `<!-- PLACEHOLDER -->` comments: portrait pricing, Pasta & Paint details and the FAQ.

`about.html` is parked: it still works if you open it, but nothing links to it. Bring it back by
re-adding `["about.html", "About", "about"]` to the links list in `js/site.js` once Peg has a photo and a bio.

## Adding photos
Drop new files (HEIC or JPG) into `_source/Peg_s Paintings/` and run `python tools/convert.py`
(needs `pip install pillow pillow-heif`). It writes `images/full`, `images/thumb` and `js/image-meta.js`.
Then add an entry to `js/data.js` using the new slug.

## Contact form
Right now the form opens the visitor's email app, pre-filled. On Netlify, add `data-netlify="true"` to the form
for real submissions; on GitHub Pages, use Formspree.

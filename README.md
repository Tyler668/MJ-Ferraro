# Paintings by Peg

Static site with no build step: plain HTML, CSS and JS. Open `index.html` through any local server:

```
python -m http.server 8765
```

## Editing content
Everything lives in **`js/data.js`**:
- `SITE`: name, email, phone, Instagram/Facebook handles, region (**placeholders now**)
- `ROOMS`: the four gallery groupings
- `WORKS`: every painting (title, size in inches, medium, room, `available`/`sold`, description)
- `PETS`, `KEEPSAKES`, `PASTA`: commissions and party photos

To mark a painting sold, change `status: "available"` to `status: "sold"`. It moves into the Sold filter and gets a red dot.

Other placeholders are marked with `<!-- PLACEHOLDER -->` comments: the About bio and photo, portrait pricing, Pasta & Paint details and FAQ.

## Adding photos
Drop new files (HEIC or JPG) into `_source/Peg_s Paintings/` and run `python tools/convert.py`
(needs `pip install pillow pillow-heif`). It writes `images/full`, `images/thumb` and `js/image-meta.js`.
Then add an entry to `js/data.js` using the new slug.

## Contact form
Right now the form opens the visitor's email app, pre-filled. On Netlify, add `data-netlify="true"` to the form
for real submissions; on GitHub Pages, use Formspree.

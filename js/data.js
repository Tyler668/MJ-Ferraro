/* ==========================================================================
   SITE CONTENT: the single place to edit text, prices and contact details.
   Image slugs refer to files in images/full and images/thumb.
   size: [width, height] in inches as the painting hangs (null if unknown).
   status: "available" | "sold" | "nfs" (not for sale)
   ========================================================================== */

window.SITE = {
  // Placeholder details: swap for the real ones before launch.
  artist: "Peg",
  brand: "Paintings by Peg",
  tagline: "Salt air, wild blooms & the places we call home",
  region: "Rhode Island",
  email: "hello@paintingsbypeg.com",
  phone: "(401) 555-0142",
  instagram: "paintingsbypeg",
  facebook: "paintingsbypeg",
};

window.ROOMS = [
  { id: "shore",   name: "Sea & Shore",         blurb: "Beaches, dunes, storms and sunsets.", cover: ["a-storm-is-brewing-16x20-acrylic-on-canvas", "stormy-light-36x36-acrylic-on-canvas-framed", "dauphin-island-sunset-24x36-acrylic-on-canvas"] },
  { id: "harbors", name: "Harbors & Hometowns", blurb: "Boatyards, harbors, fishing shacks and local landmarks.", cover: ["boatyard-12x12-acrylic-on-canvas", "fishermans-shack-sold", "gilbert-stuart-birthplace-12x12-acrylic-on-gallery-wrapped-canvas"] },
  { id: "flora",   name: "Flora & Fauna",       blurb: "Flowers, birds, sea life and other animals.", cover: ["blue-heron-family-16x16-acrylic-on-gallery-wrapped-canvas", "camellias-9x12-watercolor-on-paper", "sir-peter-rabbit-12x12-acrylic-on-canvas"] },
  { id: "tables",  name: "Tables & Tales",      blurb: "Still lifes, holidays and celebrations.", cover: ["oysters-12x12-acrylic-in-gallery-wrapped-canvas", "blue-crab-boil-8x10-acrylic-on-canvas", "marci-gras-cheer-12x12-acrylic-on-gallery-wrapped-canvas"] },
];

window.WORKS = [
  /* ---------------- Available ---------------- */
  { id: "a-storm-is-brewing", title: "A Storm Is Brewing", img: "a-storm-is-brewing-16x20-acrylic-on-canvas", size: [20, 16], medium: "Acrylic on canvas", room: "shore", status: "available", featured: true,
    blurb: "Summer thunderheads build over a pale beach, with rain already falling far out on the water." },
  { id: "birdhouses-of-dauphin-island", title: "Birdhouses of Dauphin Island", img: "birdhouses-of-dauphin-island-36x48-acrylic-on-gallery-wrapped-canvas", size: [48, 36], medium: "Acrylic on gallery-wrapped canvas", room: "harbors", place: "Dauphin Island, Alabama", status: "available", featured: true,
    blurb: "A row of brightly painted stilt houses under a sunburst sky." },
  { id: "kaleidoscope-beach", title: "Kaleidoscope Beach", img: "kaleidoscope-beach-16x20-acrylic-on-canvas", size: [20, 16], medium: "Acrylic on canvas", room: "shore", status: "available", featured: true,
    blurb: "Waves roll onto a pebbled shore under a golden sky." },
  { id: "boardwalk-to-paradise", title: "Boardwalk to Paradise", img: "boardwalk-to-paradise-18x24-acrylic-on-canvas", size: [24, 18], medium: "Acrylic on canvas", room: "shore", status: "available", featured: true,
    blurb: "A sun-bleached boardwalk crosses the dunes to a small house at the water's edge." },
  { id: "stormy-light", title: "Stormy Light", img: "stormy-light-36x36-acrylic-on-canvas-framed", size: [36, 36], medium: "Acrylic on canvas, framed", room: "shore", status: "available", featured: true,
    blurb: "A lighthouse stands against heavy surf and dark storm clouds." },
  { id: "under-the-sea", title: "Under the Sea", img: "under-the-sea-4x6ft-mixed-media-on-gallery-wrapped-canvas", size: [72, 48], sizeLabel: "4 × 6 ft", medium: "Mixed media on gallery-wrapped canvas", room: "flora", status: "available", featured: true,
    blurb: "Sea turtles glide above a textured coral reef in this large mixed media piece." },
  { id: "sandy-shores", title: "Sandy Shores", img: "sandy-shores-24x30-acrylic-on-gallery-wrapped-canvas", size: [30, 24], medium: "Acrylic on gallery-wrapped canvas", room: "shore", status: "available", featured: true,
    blurb: "A dune fence curves toward the water as the sun sets." },
  { id: "walking-on-top-of-the-world", title: "Walking on Top of the World", img: "walking-on-top-of-the-world-16x20-acrylic-on-canvas", size: [20, 16], medium: "Acrylic on canvas", room: "shore", status: "available", featured: true,
    blurb: "A boy walks across a tidal flat that reflects the sky." },
  { id: "rockport", title: "Rockport", img: "rockport-10x30-acrylic-on-canvas", size: [30, 10], medium: "Acrylic on canvas", room: "harbors", place: "Rockport, Massachusetts", status: "available", featured: true,
    blurb: "A panoramic view across the harbor to the red fishing shack, with a dory in still water." },
  { id: "boardwalk-of-dauphin-island", title: "Boardwalk of Dauphin Island", img: "boardwalk-of-dauphin-island-24x36-acrylic-on-canvas", size: [36, 24], medium: "Acrylic on canvas", room: "shore", place: "Dauphin Island, Alabama", status: "available",
    blurb: "A weathered boardwalk winds through dune grass toward a pavilion under a big Gulf sky." },
  { id: "dauphin-island-sunset", title: "Dauphin Island Sunset", img: "dauphin-island-sunset-24x36-acrylic-on-canvas", size: [36, 24], medium: "Acrylic on canvas", room: "shore", place: "Dauphin Island, Alabama", status: "available",
    blurb: "Sea oats on a white dune as the sky fades from pink to lavender." },
  { id: "blue-heron-family", title: "Blue Heron Family", img: "blue-heron-family-16x16-acrylic-on-gallery-wrapped-canvas", size: [16, 16], medium: "Acrylic on gallery-wrapped canvas", room: "flora", status: "available", featured: true,
    blurb: "Two great blue herons and a fledgling in a green thicket." },
  { id: "boatyard", title: "Boatyard", img: "boatyard-12x12-acrylic-on-canvas", size: [12, 12], medium: "Acrylic on canvas", room: "harbors", status: "available",
    blurb: "Shrimp boats tied up at their pilings, reflected in a still creek." },
  { id: "gilbert-stuart-birthplace", title: "Gilbert Stuart Birthplace", img: "gilbert-stuart-birthplace-12x12-acrylic-on-gallery-wrapped-canvas", size: [12, 12], medium: "Acrylic on gallery-wrapped canvas", room: "harbors", place: "Saunderstown, Rhode Island", status: "available",
    blurb: "The historic red homestead and mill wheel under fresh snow." },
  { id: "oysters", title: "Oysters", img: "oysters-12x12-acrylic-in-gallery-wrapped-canvas", size: [12, 12], medium: "Acrylic on gallery-wrapped canvas", room: "tables", status: "available",
    blurb: "Oysters on the half shell with slices of lemon." },
  { id: "blue-crab-boil", title: "Blue Crab Boil", img: "blue-crab-boil-8x10-acrylic-on-canvas", size: [8, 10], medium: "Acrylic on canvas", room: "tables", status: "available",
    blurb: "A pot of blue crabs painted with quick, loose strokes." },
  { id: "mardi-gras-cheer", title: "Mardi Gras Cheer", img: "marci-gras-cheer-12x12-acrylic-on-gallery-wrapped-canvas", size: [12, 12], medium: "Acrylic on gallery-wrapped canvas", room: "tables", status: "available",
    blurb: "Masks, feathers and beads at a balcony party in purple, green and gold." },
  { id: "peacock-nest", title: "Peacock Nest", img: "peacock-nest-20x20-acrylic-on-gallery-wrapped-canvas", size: [20, 20], medium: "Acrylic on gallery-wrapped canvas", room: "flora", status: "available",
    blurb: "Blue eggs in a nest of peacock feathers." },
  { id: "sir-peter-rabbit", title: "Sir Peter Rabbit", img: "sir-peter-rabbit-12x12-acrylic-on-canvas", size: [12, 12], medium: "Acrylic on canvas", room: "flora", status: "available", featured: true,
    blurb: "A hare in a waistcoat and cameo, painted as a formal portrait." },
  { id: "jellyfish", title: "Jellyfish", img: "jellyfish-18x24-oil-on-canvas", size: [18, 24], medium: "Oil on canvas", room: "flora", status: "available",
    blurb: "Sea nettles drifting through deep blue water." },
  { id: "first-bloom", title: "First Bloom", img: "first-bloom-12x12-oil-canvas", size: [12, 12], medium: "Oil on canvas", room: "flora", status: "available",
    blurb: "Two cream-colored blossoms against a dark background, painted in thick oil." },
  { id: "camellias", title: "Camellias", img: "camellias-9x12-watercolor-on-paper", size: [9, 12], medium: "Watercolor on paper", room: "flora", status: "available",
    blurb: "Pink camellias among dark green leaves." },
  { id: "a-new-day", title: "A New Day", img: "a-new-day-9x12-watercolor", size: [12, 9], medium: "Watercolor", room: "shore", status: "available",
    blurb: "A coral sunrise over a quiet, rippled sea." },
  { id: "flying-south", title: "Flying South", img: "flying-south-9x12-watercolor-on-paper", size: [9, 12], medium: "Watercolor on paper", room: "shore", status: "available",
    blurb: "A line of geese crosses a sunset sky above rippled water." },

  /* ---------------- Sold ---------------- */
  { id: "watch-hill", title: "Watch Hill", img: "watch-hill-sold", size: null, medium: "Acrylic on canvas", room: "harbors", place: "Watch Hill, Rhode Island", status: "sold",
    blurb: "Boats in the harbor below the shingled houses on the hill." },
  { id: "fishermans-shack", title: "Fisherman's Shack", img: "fishermans-shack-sold", alts: ["fishermans-shack-sold-1"], size: null, medium: "Acrylic", room: "harbors", status: "sold",
    blurb: "A shingled shack hung with buoys, with sailboats behind it at sunset." },
  { id: "in-flight", title: "In Flight", img: "in-flight-acrylic-on-36x36-canvas-sold", size: [36, 36], medium: "Acrylic on canvas", room: "shore", status: "sold",
    blurb: "Terns on weathered pilings, one taking off over the surf." },
  { id: "lighthouse", title: "Lighthouse", img: "lighthousesold", size: null, medium: "Acrylic", room: "shore", status: "sold",
    blurb: "A white lighthouse with waves breaking against the rocks." },
  { id: "vibrant-reflection", title: "Vibrant Reflection", img: "vibrant-reflection-sold", size: null, medium: "Acrylic", room: "shore", status: "sold",
    blurb: "A bridge and pier across a bay lit by the sunset." },
  { id: "orange-beach", title: "Orange Beach", img: "orange-beach-sold", size: null, medium: "Acrylic", room: "shore", place: "Orange Beach, Alabama", status: "sold",
    blurb: "Layered clouds over the Gulf, with a sailboat on the horizon." },
  { id: "sunrise", title: "Sunrise", img: "sunrise-watercolor-sold", size: null, medium: "Watercolor", room: "shore", status: "sold",
    blurb: "The sun rising over still water, reflected below." },
  { id: "reflection", title: "Reflection", img: "reflection-sold", size: null, medium: "Acrylic", room: "harbors", status: "sold",
    blurb: "An old glass lantern on a shingled wall, reflecting the village." },
  { id: "saratoga-racetrack", title: "Saratoga Racetrack", img: "saratoga-racetrack-sold", size: null, medium: "Acrylic", room: "harbors", place: "Saratoga Springs, New York", status: "sold",
    blurb: "Jockeys in bright silks walk their horses past the historic grandstand." },
  { id: "peony", title: "Peony", img: "peony-sold", size: null, medium: "Acrylic", room: "flora", status: "sold",
    blurb: "A single peony in soft pink and cream." },
  { id: "ri-flowers", title: "RI Flowers", img: "ri-flowers-sold", size: null, medium: "Acrylic", room: "flora", status: "sold",
    blurb: "Hydrangea, poppies, hibiscus and other garden flowers on a neutral background." },
  { id: "tomato-tomata", title: "Tomato, Tomata", img: "tomato-tomata-sold", size: null, medium: "Acrylic", room: "tables", status: "sold",
    blurb: "Heirloom tomatoes in late-summer colors." },
  { id: "santas-winter-wonderland", title: "Santa's Winter Wonderland", img: "santas-winter-wonderland-sold", size: null, medium: "Acrylic", room: "tables", status: "sold",
    blurb: "An old-world Santa in a red robe in a snowy forest, with a reindeer behind him." },
  { id: "girl-with-a-pearl-earring", title: "Girl with a Pearl Earring", subtitle: "after Vermeer", img: "version-of-girl-with-a-pearl-earring-sold", size: null, medium: "Acrylic", room: "tables", status: "sold",
    blurb: "Peg's version of Vermeer's portrait." },
];

/* Pet portraits: shown on the Commissions page as examples. */
window.PETS = [
  { id: "pet-rug", title: "Lounging on the Rug", img: "dog-painting-commission-example", kind: "Pet portrait commission" },
  { id: "pet-hydrangea", title: "Among the Hydrangeas", img: "dog-portrait-commission-example", kind: "Pet portrait commission" },
  { id: "pet-dapper", title: "Dressed for the Derby", img: "dog-portrait-commission-example-2", kind: "Pet portrait commission" },
  { id: "pet-doodle", title: "Doodle in Pink", img: "dog-portrait-pet-commission", kind: "Pet portrait commission" },
  { id: "pet-grass", title: "In the Tall Grass", img: "dog-portrait-pet-commission-2", kind: "Pet portrait commission" },
  { id: "pet-cat", title: "Sunflower Cat", img: "pet-portrait-commission-example", kind: "Pet portrait commission" },
  { id: "pet-spaniel", title: "Those Eyes", img: "pet-portrait-commission-example-1", kind: "Pet portrait commission" },
  { id: "pet-beagle", title: "Sweet Beagle", img: "pet-portrait-commission-example-2", kind: "Pet portrait commission" },
];

/* Hand-painted objects: shown as taped-up photos in the viewer. */
window.KEEPSAKES = [
  { id: "keep-buoy", title: "Hand-Painted Buoy", img: "painted-buoy-example", kind: "Custom keepsake", object: true,
    blurb: "A lobster buoy painted with a beach scene and dory." },
  { id: "keep-bag-peony", title: "Peony Crossbody Bag", img: "painted-crossbody-example", kind: "Custom keepsake", object: true,
    blurb: "Peonies hand-painted on a black canvas crossbody bag." },
  { id: "keep-bag-rose", title: "Garden Rose Crossbody Bag", img: "painted-crossbody-example-1", kind: "Custom keepsake", object: true,
    blurb: "Pink roses painted across the pockets of a crossbody bag." },
  { id: "keep-ornament", title: "Pet Ornament", img: "pet-ornament-example", kind: "Custom keepsake", object: true,
    blurb: "A pet portrait painted on a wooden ornament." },
  { id: "keep-slate", title: "Hand-Painted Slate", img: "handpainted-stone-tile-example", kind: "Custom keepsake", object: true,
    blurb: "A slate tile lettered and painted with spring flowers." },
  { id: "keep-table", title: "Botanical Console Table", img: "handpainted-table-not-for-sale", kind: "Painted furniture · not for sale", status: "nfs", object: true,
    blurb: "A demilune table painted with lilies, foxglove, passionflowers and butterflies." },
];

/* Pasta & Paint party photos */
window.PASTA = [
  { id: "pp-waves", img: "pandp2", title: "Wave paintings", caption: "Guests with their finished wave paintings." },
  { id: "pp-sunset", img: "pandp3", title: "Marsh at sunset", caption: "Finished marsh paintings, held up against the real view." },
  { id: "pp-table", img: "pandp4", title: "The long table", caption: "Painting at the long table." },
  { id: "pp-deck", img: "pandp1", title: "Dinner on the deck", caption: "Dinner outside under the umbrella." },
  { id: "pp-chef", img: "pandp7", title: "The chef", caption: "Dinner is cooked during the lesson." },
  { id: "pp-pomodoro", img: "pandp8", title: "Penne pomodoro", caption: "Penne with tomato, basil and parmesan." },
  { id: "pp-pesto", img: "pandp9", title: "Penne with pesto", caption: "Penne with basil pesto." },
  { id: "pp-buffet", img: "pandp5", title: "Family style", caption: "Dinner served family style." },
  { id: "pp-antipasti", img: "pandp6", title: "Antipasti", caption: "Grilled vegetables and bruschetta." },
];

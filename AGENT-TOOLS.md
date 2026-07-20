<!-- GENERATED FILE — do not edit. Run: npm run tools:generate -->
# Knowledge Engine — tool reference

The `plant_researcher` fills the **species record**; the `editorial_writer` fills the **blogpost**. Both are validated on insert. Copy an example below, change the values, and keep every required field.

### `species record`

The curated care record. Sections with a cross-field invariant are listed under "Cross-field invariants" below.

| Field | Type | Required |
|---|---|---|
| `scientificName` | string | required |
| `commonNamesEn` | array of string | optional |
| `commonNamesEs` | array of string | optional |
| `watering` | object | required |
| `misting` | object | optional |
| `light` | object | required |
| `temperature` | object | required |
| `humidity` | object | required |
| `fertilizing` | object | required |
| `repotting` | object | required |
| `maintenance` | object | required |
| `nativeClimate` | object | required |
| `cultivars` | array of object | optional |
| `growthHabit` | `upright` \| `climber` \| `trailing` \| `clumping` \| `rosette` \| `tree` \| `shrub` \| `other` \| null | optional |
| `metadata` | object | required |

```json
{
  "scientificName": "Epipremnum aureum",
  "growthHabit": "climber",
  "commonNamesEn": [
    "Pothos",
    "Golden pothos",
    "Devil's ivy",
    "Devil's vine",
    "Money plant",
    "Ceylon creeper",
    "Ivy arum",
    "Taro vine",
    "Silver vine",
    "Solomon Islands ivy",
    "Hunter's robe"
  ],
  "commonNamesEs": [
    "Potos",
    "Poto",
    "Potus",
    "Hiedra del diablo",
    "Potos dorado",
    "Teléfono"
  ],
  "watering": {
    "baseIntervalDays": 9,
    "soilDrynessBeforeWatering": "half-dry",
    "droughtTolerance": "high",
    "temperatureSensitivity": "medium",
    "lightSensitivity": "medium",
    "humiditySensitivity": "low",
    "reduceInDormancy": true
  },
  "misting": {
    "benefit": "avoid",
    "baseFrequencyDays": null,
    "note": null
  },
  "light": {
    "minimum": "low",
    "ideal": "bright-indirect",
    "maximum": "bright-indirect"
  },
  "temperature": {
    "survivalMinC": 10,
    "idealMinC": 18,
    "idealMaxC": 30,
    "survivalMaxC": 35
  },
  "humidity": {
    "minimumPct": 40,
    "idealPct": 60
  },
  "fertilizing": {
    "activeSeasons": [
      "spring",
      "summer"
    ],
    "inSeasonFrequencyDays": 30,
    "reduceInDormancy": true
  },
  "repotting": {
    "typicalIntervalMonths": 24,
    "signs": [
      "Roots growing out of the drainage holes",
      "Roots circling densely or pushing the plant up out of the pot (root-bound)",
      "Water runs straight through and the mix dries out very fast",
      "Noticeably slowed growth and more frequent wilting between waterings"
    ]
  },
  "maintenance": {
    "pruning": "Low-maintenance. Tip-prune in spring/summer just above a leaf node to encourage branching and a bushier plant and to keep long trailing vines tidy; cut back leggy or bare stems to rejuvenate. Remove yellowed or damaged leaves anytime. Prunings root easily in water or moist mix as new plants.",
    "rotationDays": 30,
    "leafCleaningDays": 30,
    "commonPests": [
      "Mealybugs",
      "Spider mites",
      "Scale",
      "Fungus gnats",
      "Root rot (from overwatering / poor drainage)",
      "Fungal leaf spot / botrytis"
    ]
  },
  "nativeClimate": {
    "description": "Tropical evergreen aroid of warm, humid lowland forests in the Pacific. Most current botanical authorities (Missouri Botanical Garden, Kew/Wikipedia) treat it as native to Mo'orea in the Society Islands of French Polynesia, though some horticultural references (e.g. UF/IFAS) cite the Solomon Islands; either way it is a frost-free, humid tropical-forest plant. In the wild it is a hemiepiphytic climber that scrambles along the forest floor and ascends tree trunks, its juvenile heart-shaped leaves giving way to much larger, lobed mature leaves high in the canopy. It is now naturalized — and an aggressive invasive — across many tropical and subtropical regions worldwide (including parts of Florida, South Africa, Australia and Southeast Asia).",
    "koppen": "Af",
    "hardinessMinC": 10,
    "hardinessMaxC": 35
  },
  "cultivars": [
    {
      "name": "Golden Pothos",
      "alsoKnownAs": [
        "Golden",
        "Aureum",
        "Devil's ivy (typical form)"
      ],
      "group": null,
      "description": "The classic, most common form: glossy mid-green heart-shaped leaves marbled and streaked with golden-yellow. Vigorous, fast-growing trailer/climber and the most forgiving of low light.",
      "careNote": null
    },
    {
      "name": "Marble Queen",
      "alsoKnownAs": [],
      "group": null,
      "description": "Heavily variegated form: green leaves streaked and splashed with creamy white, often roughly half-and-half. Slower and more compact than plain golden pothos.",
      "careNote": "Heavily white-variegated, so it has less chlorophyll — give it bright indirect light to keep the variegation crisp and prevent reversion to green; grows more slowly."
    },
    {
      "name": "Snow Queen",
      "alsoKnownAs": [],
      "group": null,
      "description": "Even whiter than Marble Queen — predominantly creamy-white leaves with green speckling and streaks. Striking but the least chlorophyll of the white-variegated forms.",
      "careNote": "Needs abundant bright indirect light to sustain its mostly-white leaves and avoid scorch; among the slowest-growing and most light-hungry cultivars."
    },
    {
      "name": "Neon",
      "alsoKnownAs": [],
      "group": null,
      "description": "Solid bright chartreuse / lime-green leaves with no variegation, thinner and slightly more heart-shaped. New growth is the most luminous.",
      "careNote": "Not variegated, so it tolerates lower light, but its neon glow is brightest in good bright indirect light; in deep shade the colour dulls toward plain green."
    },
    {
      "name": "Pearls and Jade",
      "alsoKnownAs": [],
      "group": null,
      "description": "A University of Florida sport of Marble Queen: smaller teardrop-shaped leaves edged and speckled in white and silvery-grey over green, with variegation concentrated near the margins. Compact, slower growth.",
      "careNote": "Smaller-leaved and white-edged; bright indirect light keeps the crisp margin variegation and supports its slower growth."
    },
    {
      "name": "N'Joy",
      "alsoKnownAs": [
        "NJoy",
        "N Joy"
      ],
      "group": null,
      "description": "Compact cultivar with small leaves in bold, well-defined blocks of green and creamy white (less speckled, more patchy than Marble Queen). Bushier, shorter internodes.",
      "careNote": "Strongly variegated and small-leaved; needs bright indirect light to hold colour and grows slowly."
    },
    {
      "name": "Manjula",
      "alsoKnownAs": [
        "Happy Leaf"
      ],
      "group": null,
      "description": "Patented cultivar with broad, wavy-edged leaves that don't lie flat, swirled and splashed with green, cream, white and silvery tones; each leaf is uniquely marbled.",
      "careNote": "Heavily and palely variegated with wavy leaves; bright indirect light keeps the marbling vivid, and it grows more slowly and bushier than golden pothos."
    },
    {
      "name": "Global Green",
      "alsoKnownAs": [],
      "group": null,
      "description": "Green-on-green variegation: deep-green leaf margins surrounding a lighter mid-green to apple-green centre, with no white or yellow. A relatively recent, eye-catching introduction.",
      "careNote": null
    },
    {
      "name": "Jade",
      "alsoKnownAs": [
        "Jade Pothos"
      ],
      "group": null,
      "description": "Plain, solid deep-green heart-shaped leaves with no variegation. Essentially the non-variegated reference form; vigorous and the most shade-tolerant.",
      "careNote": "Solid green, so it is the most tolerant of low light of all the cultivars."
    },
    {
      "name": "Cebu Blue",
      "alsoKnownAs": [
        "Blue pothos"
      ],
      "group": null,
      "description": "Distinctive narrow, elongated lance-shaped leaves with a silvery blue-green metallic sheen; develops natural splits (fenestrations) as it matures and climbs. Often sold as a pothos but botanically usually treated as Epipremnum pinnatum rather than E. aureum.",
      "careNote": "Often classified under Epipremnum pinnatum, not E. aureum; care is effectively the same as other pothos."
    }
  ],
  "metadata": {
    "confidence": "high",
    "sources": [
      {
        "title": "Missouri Botanical Garden — Epipremnum aureum (Plant Finder)",
        "url": "http://www.missouribotanicalgarden.org/PlantFinder/PlantFinderDetails.aspx?taxonid=276360",
        "accessedAt": "2026-06-19"
      },
      {
        "title": "Clemson Cooperative Extension HGIC — How to Grow Pothos Indoors (Epipremnum spp.)",
        "url": "https://hgic.clemson.edu/factsheet/how-to-grow-pothos-indoors-epipremnum-spp-care-cultivars-and-common-problems/",
        "accessedAt": "2026-06-19"
      },
      {
        "title": "Royal Horticultural Society — Epipremnum Growing Guide",
        "url": "https://www.rhs.org.uk/plants/epipremnum/growing-guide",
        "accessedAt": "2026-06-19"
      },
      {
        "title": "UF/IFAS Extension — Epipremnum aureum (Pothos) (EP151)",
        "url": "https://ask.ifas.ufl.edu/publication/EP151",
        "accessedAt": "2026-06-19"
      },
      {
        "title": "NC State Extension Gardener Plant Toolbox — Epipremnum aureum",
        "url": "https://plants.ces.ncsu.edu/plants/epipremnum-aureum/",
        "accessedAt": "2026-06-19"
      },
      {
        "title": "ASPCA — Golden Pothos (toxic plants)",
        "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/golden-pothos",
        "accessedAt": "2026-06-19"
      },
      {
        "title": "Wikipedia — Epipremnum aureum (taxonomy, native range, flowering)",
        "url": "https://en.wikipedia.org/wiki/Epipremnum_aureum",
        "accessedAt": "2026-06-19"
      }
    ]
  }
}
```

### `blogpost (seven keys)`

Spanish leads (required); English keys may be null.

| Field | Type | Required |
|---|---|---|
| `slug` | string | required |
| `speciesSlug` | string \| null | optional |
| `status` | union | optional |
| `titleEs` | string | required |
| `titleEn` | string \| null | optional |
| `excerptEs` | string | required |
| `excerptEn` | string \| null | optional |
| `bodyEs` | string | required |
| `bodyEn` | string \| null | optional |
| `coverImageUrl` | string \| null | optional |
| `coverImageObjectKey` | string \| null | optional |
| `coverImagePrompt` | string \| null | optional |
| `youtubeUrl` | string \| null | optional |
| `ctaLink` | string \| null | optional |
| `ctaLabelEs` | string \| null | optional |
| `ctaLabelEn` | string \| null | optional |

```json
{
  "slug": "epipremnum-aureum",
  "titleEs": "Potos: la enredadera de 8 dólares que se niega a morir",
  "titleEn": "Pothos: The $8 Vine That Refuses to Die",
  "excerptEs": "Si nunca has logrado mantener una planta viva, empieza por aquí. Descubre cómo cuidar la hiedra del diablo, cuál variedad tienes y por qué el riego es la única regla que de verdad importa.",
  "excerptEn": "Never kept a plant alive? Start here. Meet devil's ivy: how to water it, why overwatering (not neglect) is the real killer, and how to tell which pothos variety is yours.",
  "bodyEs": "A la mayoría de las plantas de interior las mata el exceso de atención. El potos prospera con lo contrario: un poco de descuido amable, un riego olvidado, ese rincón oscuro donde nadie más quiere vivir. Así se ganó el apodo de *hiedra del diablo*: se mantiene verde donde casi nada sobrevive, y es famosamente, tercamente difícil de matar.\n\nSi nunca has logrado mantener una planta con vida, empieza por aquí. *Epipremnum aureum* es un aroide trepador tropical que se cultiva por sus hojas brillantes en forma de corazón, que se derraman desde una repisa o trepan por un tutor de musgo. Vigoroso, indulgente y al que no le importa una habitación sombría: es la planta que convierte el pulgar negro en verde.\n\n![un potos dorado con largas guías colgando desde lo alto de un librero, en una sala con luz suave, las hojas cayendo hacia el suelo. Resaltar el largo y la frondosidad; luz cálida y hogareña de mañana](https://my-plants-cdn.retaxmaster.com/blog/media/2c8475de-223d-40f8-9b45-3c56cc59567c.webp)",
  "bodyEn": "Most houseplants die of fuss. The pothos thrives on the opposite — a little benign neglect, a forgotten watering, a dim corner nobody else will live in. That's how it earned the nickname *devil's ivy*: it stays green where almost nothing else does, and it's famously, stubbornly hard to kill.\n\nIf you've never kept a plant alive, start here. *Epipremnum aureum* is a tropical climbing aroid grown for glossy, heart-shaped leaves that spill off a shelf or scramble up a moss pole. Vigorous, forgiving, and unbothered by a gloomy room — it's the plant that turns brown thumbs green.\n\n![a golden pothos trailing long vines off a high bookshelf in a softly lit living room, leaves cascading toward the floor. Emphasise length and lushness; warm, homey morning light.](https://my-plants-cdn.retaxmaster.com/blog/media/2c8475de-223d-40f8-9b45-3c56cc59567c.webp)",
  "coverImagePrompt": "Subject & composition: A lush golden pothos (Epipremnum aureum) as the hero — a healthy trailing plant in a simple terracotta or matte-ceramic pot set on a light wooden shelf or ledge, with long vines of glossy, heart-shaped green leaves marbled in golden-yellow cascading down and across the frame. Position the pot slightly off-centre using the rule of thirds, leaving clean negative space on one side for a title overlay. Show the leaves in crisp detail so the yellow-on-green variegation reads clearly. Shot type / photographic plane: Mid shot with shallow depth of field — the front leaves tack-sharp, the trailing vines and background gently softening. Lighting: Soft, warm, natural morning light coming from the side (window light), gentle directional glow that makes the glossy leaves catch a subtle highlight; airy and bright, no harsh shadows. Camera angle: Slightly above eye level looking gently down at the plant and its trailing vines, close and intimate. Aspect ratio / dimensions: 16:9 landscape, approximately 1600px wide, suitable for a blog cover / OG image. Scenography / props / background: A cozy, uncluttered home interior — a pale neutral wall, a hint of a bookshelf or a bright window blurred in the background; a couple of out-of-focus houseplants for depth. Keep props minimal so the pothos dominates. Palette & mood: Fresh greens and warm golds against soft neutral creams and light wood tones; calm, welcoming, homey and effortless — the feeling of an easygoing, hard-to-kill plant. Must-include: healthy glossy heart-shaped leaves with visible golden-yellow variegation, long trailing vines, a pot with the look of good drainage, clear space for a headline. Must-avoid: no text, watermarks or logos; no wilting, yellowing or damaged leaves; no water pooling in a saucer; no oversaturated or artificial neon colours; no cluttered or dark background; no human faces; no other plant species presented as the main subject."
}
```

### Cross-field invariants

- **misting:** baseFrequencyDays must be null when benefit is `avoid`, and set (a positive integer) otherwise.
- **light:** minimum <= ideal <= maximum, by the light-level ranking low < medium < bright-indirect < direct.
- **temperature:** survivalMinC <= idealMinC <= idealMaxC <= survivalMaxC.
- **humidity:** minimumPct <= idealPct.
- **nativeClimate:** hardinessMinC <= hardinessMaxC.

### Rules enforced outside the schema

- growthHabit: a fresh/enrich curation must set it; the sentinel value `other` is accepted ONLY with a non-empty `growthHabitOtherReason` (a KE-curation field enforced in scripts/lib/validate.ts — it is NOT part of the shared record, so there is no structural tripwire for it).

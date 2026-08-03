import type { z } from 'zod';
import type { SpeciesRecord } from '@retaxmaster/my-plants-species-schema';
import { blogpostInputSchema } from '@retaxmaster/my-plants-species-schema';

// A real, schema-valid curated record + blogpost, seeded once from db:dump of "Epipremnum aureum". The
// generator safeParse-validates both against the shared schema on every run, so if the contract tightens
// and this example stops parsing, `npm run tools:check` fails loudly — the example can never silently rot.
// The blogpost bodies are trimmed to a representative intro (the full curated bodies run ~10 KB each).
// EXAMPLE_BLOGPOST is typed as the schema INPUT (`z.input`) — the seven content keys + slug an agent
// actually fills — not the output type, whose defaulted fields (status/speciesSlug/…) the agent never sets.

export const EXAMPLE_RECORD: SpeciesRecord = {
  "scientificName": "Epipremnum aureum",
  "growthHabit": "climber",
  "juvenilePeriodMonths": null,
  "juvenileRepotIntervalMonths": null,
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
    "typicalIntervalMonths": 24
  },
  "maintenance": {
    "pruning": {
      "en": "Low-maintenance. Tip-prune in spring/summer just above a leaf node to encourage branching and a bushier plant and to keep long trailing vines tidy; cut back leggy or bare stems to rejuvenate. Remove yellowed or damaged leaves anytime. Prunings root easily in water or moist mix as new plants.",
      "es": "Bajo mantenimiento. Poda las puntas en primavera/verano justo encima de un nudo foliar para fomentar la ramificación y una planta más tupida, y para mantener ordenadas las guías colgantes largas; corta los tallos desnudos o desgarbados para rejuvenecer la planta. Retira las hojas amarillas o dañadas en cualquier momento. Los esquejes enraízan fácilmente en agua o en sustrato húmedo para producir nuevas plantas."
    },
    "rotationDays": 30,
    "leafCleaningDays": 30,
    "commonPests": {
      "en": [
        "Mealybugs",
        "Spider mites",
        "Scale",
        "Fungus gnats",
        "Root rot (from overwatering / poor drainage)",
        "Fungal leaf spot / botrytis"
      ],
      "es": [
        "Cochinillas",
        "Ácaros",
        "Escamas",
        "Mosquitos del sustrato",
        "Pudrición de raíz (por exceso de riego / mal drenaje)",
        "Mancha foliar fúngica / botritis"
      ]
    }
  },
  "nativeClimate": {
    "description": {
      "en": "Tropical evergreen aroid of warm, humid lowland forests in the Pacific. Most current botanical authorities (Missouri Botanical Garden, Kew/Wikipedia) treat it as native to Mo'orea in the Society Islands of French Polynesia, though some horticultural references (e.g. UF/IFAS) cite the Solomon Islands; either way it is a frost-free, humid tropical-forest plant. In the wild it is a hemiepiphytic climber that scrambles along the forest floor and ascends tree trunks, its juvenile heart-shaped leaves giving way to much larger, lobed mature leaves high in the canopy. It is now naturalized — and an aggressive invasive — across many tropical and subtropical regions worldwide (including parts of Florida, South Africa, Australia and Southeast Asia).",
      "es": "Aroide tropical perennifolio de bosques cálidos y húmedos de tierras bajas del Pacífico. La mayoría de las autoridades botánicas actuales (Missouri Botanical Garden, Kew/Wikipedia) lo consideran nativo de Mo'orea, en las Islas de la Sociedad de la Polinesia Francesa, aunque algunas referencias hortícolas (p. ej. UF/IFAS) citan las Islas Salomón; en cualquier caso, es una planta de bosque tropical húmedo libre de heladas. En estado silvestre es una trepadora hemiepífita que se arrastra por el suelo del bosque y asciende por los troncos de los árboles; sus hojas juveniles en forma de corazón dan paso a hojas adultas mucho más grandes y lobuladas en lo alto del dosel. Actualmente está naturalizada —y es una invasora agresiva— en muchas regiones tropicales y subtropicales del mundo (incluyendo partes de Florida, Sudáfrica, Australia y el sureste asiático)."
    },
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
      "description": {
        "en": "The classic, most common form: glossy mid-green heart-shaped leaves marbled and streaked with golden-yellow. Vigorous, fast-growing trailer/climber and the most forgiving of low light.",
        "es": "La forma clásica y más común: hojas brillantes, verde medio, en forma de corazón, jaspeadas y veteadas de amarillo dorado. Trepadora/colgante vigorosa y de crecimiento rápido, y la más tolerante a la poca luz."
      },
      "careNote": null
    },
    {
      "name": "Marble Queen",
      "alsoKnownAs": [],
      "group": null,
      "description": {
        "en": "Heavily variegated form: green leaves streaked and splashed with creamy white, often roughly half-and-half. Slower and more compact than plain golden pothos.",
        "es": "Forma muy variegada: hojas verdes veteadas y salpicadas de blanco cremoso, a menudo en proporciones casi iguales. Más lenta y compacta que el potos dorado liso."
      },
      "careNote": {
        "en": "Heavily white-variegated, so it has less chlorophyll — give it bright indirect light to keep the variegation crisp and prevent reversion to green; grows more slowly.",
        "es": "Al estar fuertemente variegada de blanco, tiene menos clorofila: dale luz indirecta brillante para mantener la variegación nítida y evitar que revierta a verde; crece más despacio."
      }
    },
    {
      "name": "Snow Queen",
      "alsoKnownAs": [],
      "group": null,
      "description": {
        "en": "Even whiter than Marble Queen — predominantly creamy-white leaves with green speckling and streaks. Striking but the least chlorophyll of the white-variegated forms.",
        "es": "Aún más blanca que Marble Queen: hojas predominantemente blanco cremoso con motas y vetas verdes. Llamativa, pero la que tiene menos clorofila de las formas variegadas en blanco."
      },
      "careNote": {
        "en": "Needs abundant bright indirect light to sustain its mostly-white leaves and avoid scorch; among the slowest-growing and most light-hungry cultivars.",
        "es": "Necesita abundante luz indirecta brillante para sostener sus hojas mayormente blancas y evitar quemaduras; es de los cultivares de crecimiento más lento y mayor exigencia de luz."
      }
    },
    {
      "name": "Neon",
      "alsoKnownAs": [],
      "group": null,
      "description": {
        "en": "Solid bright chartreuse / lime-green leaves with no variegation, thinner and slightly more heart-shaped. New growth is the most luminous.",
        "es": "Hojas de un verde lima/chartreuse brillante y sólido, sin variegación, más delgadas y con forma de corazón algo más marcada. El crecimiento nuevo es el más luminoso."
      },
      "careNote": {
        "en": "Not variegated, so it tolerates lower light, but its neon glow is brightest in good bright indirect light; in deep shade the colour dulls toward plain green.",
        "es": "Al no ser variegada, tolera menos luz, pero su brillo neón es más intenso con buena luz indirecta brillante; en sombra profunda el color se apaga hacia un verde liso."
      }
    },
    {
      "name": "Pearls and Jade",
      "alsoKnownAs": [],
      "group": null,
      "description": {
        "en": "A University of Florida sport of Marble Queen: smaller teardrop-shaped leaves edged and speckled in white and silvery-grey over green, with variegation concentrated near the margins. Compact, slower growth.",
        "es": "Una mutación de Marble Queen desarrollada por la Universidad de Florida: hojas más pequeñas, en forma de gota, con bordes y motas blancas y gris plateado sobre verde, con la variegación concentrada cerca de los márgenes. Compacta, de crecimiento más lento."
      },
      "careNote": {
        "en": "Smaller-leaved and white-edged; bright indirect light keeps the crisp margin variegation and supports its slower growth.",
        "es": "De hoja más pequeña y borde blanco; la luz indirecta brillante mantiene nítida la variegación del margen y favorece su crecimiento más lento."
      }
    },
    {
      "name": "N'Joy",
      "alsoKnownAs": [
        "NJoy",
        "N Joy"
      ],
      "group": null,
      "description": {
        "en": "Compact cultivar with small leaves in bold, well-defined blocks of green and creamy white (less speckled, more patchy than Marble Queen). Bushier, shorter internodes.",
        "es": "Cultivar compacto con hojas pequeñas en bloques marcados y bien definidos de verde y blanco cremoso (menos moteado y más en parches que Marble Queen). Más tupido, con entrenudos más cortos."
      },
      "careNote": {
        "en": "Strongly variegated and small-leaved; needs bright indirect light to hold colour and grows slowly.",
        "es": "Fuertemente variegada y de hoja pequeña; necesita luz indirecta brillante para conservar el color y crece despacio."
      }
    },
    {
      "name": "Manjula",
      "alsoKnownAs": [
        "Happy Leaf"
      ],
      "group": null,
      "description": {
        "en": "Patented cultivar with broad, wavy-edged leaves that don't lie flat, swirled and splashed with green, cream, white and silvery tones; each leaf is uniquely marbled.",
        "es": "Cultivar patentado de hojas anchas y de borde ondulado que no quedan planas, con remolinos y salpicaduras de tonos verde, crema, blanco y plateado; cada hoja está jaspeada de forma única."
      },
      "careNote": {
        "en": "Heavily and palely variegated with wavy leaves; bright indirect light keeps the marbling vivid, and it grows more slowly and bushier than golden pothos.",
        "es": "Muy variegada en tonos pálidos y con hojas onduladas; la luz indirecta brillante mantiene vivo el jaspeado, y crece más despacio y más tupida que el potos dorado."
      }
    },
    {
      "name": "Global Green",
      "alsoKnownAs": [],
      "group": null,
      "description": {
        "en": "Green-on-green variegation: deep-green leaf margins surrounding a lighter mid-green to apple-green centre, with no white or yellow. A relatively recent, eye-catching introduction.",
        "es": "Variegación verde sobre verde: márgenes de un verde intenso que rodean un centro verde medio a verde manzana más claro, sin blanco ni amarillo. Una introducción relativamente reciente y llamativa."
      },
      "careNote": null
    },
    {
      "name": "Jade",
      "alsoKnownAs": [
        "Jade Pothos"
      ],
      "group": null,
      "description": {
        "en": "Plain, solid deep-green heart-shaped leaves with no variegation. Essentially the non-variegated reference form; vigorous and the most shade-tolerant.",
        "es": "Hojas lisas, de un verde intenso sólido, en forma de corazón, sin variegación. Es esencialmente la forma de referencia no variegada; vigorosa y la más tolerante a la sombra."
      },
      "careNote": {
        "en": "Solid green, so it is the most tolerant of low light of all the cultivars.",
        "es": "Al ser completamente verde, es la más tolerante a la poca luz de todos los cultivares."
      }
    },
    {
      "name": "Cebu Blue",
      "alsoKnownAs": [
        "Blue pothos"
      ],
      "group": null,
      "description": {
        "en": "Distinctive narrow, elongated lance-shaped leaves with a silvery blue-green metallic sheen; develops natural splits (fenestrations) as it matures and climbs. Often sold as a pothos but botanically usually treated as Epipremnum pinnatum rather than E. aureum.",
        "es": "Hojas distintivas, estrechas, alargadas y lanceoladas, con un brillo metálico azul verdoso plateado; desarrolla hendiduras naturales (fenestraciones) a medida que madura y trepa. A menudo se vende como potos, pero botánicamente suele clasificarse como Epipremnum pinnatum y no como E. aureum."
      },
      "careNote": {
        "en": "Often classified under Epipremnum pinnatum, not E. aureum; care is effectively the same as other pothos.",
        "es": "A menudo se clasifica bajo Epipremnum pinnatum y no E. aureum; el cuidado es prácticamente el mismo que el de otros potos."
      }
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
};

export const EXAMPLE_BLOGPOST: z.input<typeof blogpostInputSchema> = {
  "slug": "epipremnum-aureum",
  "titleEs": "Potos: la enredadera de 8 dólares que se niega a morir",
  "titleEn": "Pothos: The $8 Vine That Refuses to Die",
  "excerptEs": "Si nunca has logrado mantener una planta viva, empieza por aquí. Descubre cómo cuidar la hiedra del diablo, cuál variedad tienes y por qué el riego es la única regla que de verdad importa.",
  "excerptEn": "Never kept a plant alive? Start here. Meet devil's ivy: how to water it, why overwatering (not neglect) is the real killer, and how to tell which pothos variety is yours.",
  "bodyEs": "A la mayoría de las plantas de interior las mata el exceso de atención. El potos prospera con lo contrario: un poco de descuido amable, un riego olvidado, ese rincón oscuro donde nadie más quiere vivir. Así se ganó el apodo de *hiedra del diablo*: se mantiene verde donde casi nada sobrevive, y es famosamente, tercamente difícil de matar.\n\nSi nunca has logrado mantener una planta con vida, empieza por aquí. *Epipremnum aureum* es un aroide trepador tropical que se cultiva por sus hojas brillantes en forma de corazón, que se derraman desde una repisa o trepan por un tutor de musgo. Vigoroso, indulgente y al que no le importa una habitación sombría: es la planta que convierte el pulgar negro en verde.\n\n![un potos dorado con largas guías colgando desde lo alto de un librero, en una sala con luz suave, las hojas cayendo hacia el suelo. Resaltar el largo y la frondosidad; luz cálida y hogareña de mañana](https://my-plants-cdn.retaxmaster.com/blog/media/2c8475de-223d-40f8-9b45-3c56cc59567c.webp)",
  "bodyEn": "Most houseplants die of fuss. The pothos thrives on the opposite — a little benign neglect, a forgotten watering, a dim corner nobody else will live in. That's how it earned the nickname *devil's ivy*: it stays green where almost nothing else does, and it's famously, stubbornly hard to kill.\n\nIf you've never kept a plant alive, start here. *Epipremnum aureum* is a tropical climbing aroid grown for glossy, heart-shaped leaves that spill off a shelf or scramble up a moss pole. Vigorous, forgiving, and unbothered by a gloomy room — it's the plant that turns brown thumbs green.\n\n![a golden pothos trailing long vines off a high bookshelf in a softly lit living room, leaves cascading toward the floor. Emphasise length and lushness; warm, homey morning light.](https://my-plants-cdn.retaxmaster.com/blog/media/2c8475de-223d-40f8-9b45-3c56cc59567c.webp)",
  "coverImagePrompt": "Subject & composition: A lush golden pothos (Epipremnum aureum) as the hero — a healthy trailing plant in a simple terracotta or matte-ceramic pot set on a light wooden shelf or ledge, with long vines of glossy, heart-shaped green leaves marbled in golden-yellow cascading down and across the frame. Position the pot slightly off-centre using the rule of thirds, leaving clean negative space on one side for a title overlay. Show the leaves in crisp detail so the yellow-on-green variegation reads clearly. Shot type / photographic plane: Mid shot with shallow depth of field — the front leaves tack-sharp, the trailing vines and background gently softening. Lighting: Soft, warm, natural morning light coming from the side (window light), gentle directional glow that makes the glossy leaves catch a subtle highlight; airy and bright, no harsh shadows. Camera angle: Slightly above eye level looking gently down at the plant and its trailing vines, close and intimate. Aspect ratio / dimensions: 16:9 landscape, approximately 1600px wide, suitable for a blog cover / OG image. Scenography / props / background: A cozy, uncluttered home interior — a pale neutral wall, a hint of a bookshelf or a bright window blurred in the background; a couple of out-of-focus houseplants for depth. Keep props minimal so the pothos dominates. Palette & mood: Fresh greens and warm golds against soft neutral creams and light wood tones; calm, welcoming, homey and effortless — the feeling of an easygoing, hard-to-kill plant. Must-include: healthy glossy heart-shaped leaves with visible golden-yellow variegation, long trailing vines, a pot with the look of good drainage, clear space for a headline. Must-avoid: no text, watermarks or logos; no wilting, yellowing or damaged leaves; no water pooling in a saucer; no oversaturated or artificial neon colours; no cluttered or dark background; no human faces; no other plant species presented as the main subject."
};

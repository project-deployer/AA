/**
 * Crop image URLs - using Wikimedia Commons (public domain, high reliability).
 * Each crop has a fallback emoji for instant display if image fails.
 */
const CROP_IMAGES: Record<string, { url: string; emoji: string }> = {
  paddy: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Oryza_sativa_-_NRCS.jpg/440px-Oryza_sativa_-_NRCS.jpg",
    emoji: "🌾",
  },
  rice: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Oryza_sativa_-_NRCS.jpg/440px-Oryza_sativa_-_NRCS.jpg",
    emoji: "🌾",
  },
  wheat: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Wheat-Schu%C3%9Fra-Khorasan.jpg/440px-Wheat-Schu%C3%9Fra-Khorasan.jpg",
    emoji: "🌾",
  },
  cotton: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Cotton_blooming_on_field.jpg/440px-Cotton_blooming_on_field.jpg",
    emoji: "🤍",
  },
  sugarcane: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/SugarcaneP1070137.jpg/440px-SugarcaneP1070137.jpg",
    emoji: "🥤",
  },
  maize: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Corn_silk.jpg/440px-Corn_silk.jpg",
    emoji: "🌽",
  },
  chickpea: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Cicer_arietinum_002.JPG/440px-Cicer_arietinum_002.JPG",
    emoji: "🫘",
  },
  mustard: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Sinapis_alba01.jpg/440px-Sinapis_alba01.jpg",
    emoji: "🌼",
  },
  groundnut: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/ArachisHypogaeaFlower.jpg/440px-ArachisHypogaeaFlower.jpg",
    emoji: "🥜",
  },
  soybean: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Glycine_max_002.JPG/440px-Glycine_max_002.JPG",
    emoji: "🫘",
  },
  bajra: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Various_cereals.jpg/440px-Various_cereals.jpg",
    emoji: "🌾",
  },
  jowar: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Sorghum_field_and_head.jpg/440px-Sorghum_field_and_head.jpg",
    emoji: "🌾",
  },
  vegetables: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Various_vegetables.jpg/440px-Various_vegetables.jpg",
    emoji: "🥬",
  },
  pulses: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Varieties_of_pulses.jpg/440px-Varieties_of_pulses.jpg",
    emoji: "🫘",
  },
  millet: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Various_cereals.jpg/440px-Various_cereals.jpg",
    emoji: "🌾",
  },
};

const DEFAULT_IMAGE = {
  url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%2310b981' width='100' height='100'/%3E%3Ctext x='50' y='50' font-size='60' text-anchor='middle' dy='.3em' fill='white'%3E🌾%3C/text%3E%3C/svg%3E",
  emoji: "🌾",
};

export function getCropImageUrl(cropName: string): string {
  const key = cropName.toLowerCase().trim().replace(/\s+/g, "");
  for (const [k, data] of Object.entries(CROP_IMAGES)) {
    if (key.includes(k) || k.includes(key)) return data.url;
  }
  return DEFAULT_IMAGE.url;
}

export function getCropEmoji(cropName: string): string {
  const key = cropName.toLowerCase().trim().replace(/\s+/g, "");
  for (const [k, data] of Object.entries(CROP_IMAGES)) {
    if (key.includes(k) || k.includes(key)) return data.emoji;
  }
  return DEFAULT_IMAGE.emoji;
}

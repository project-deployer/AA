/**
 * Crop image URLs - using placeholder with crop-themed backgrounds.
 * Replace with your own CDN/hosted images for production.
 */
const CROP_IMAGES: Record<string, string> = {
  paddy: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80",
  rice: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80",
  wheat: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020d?auto=format&fit=crop&w=400&q=80",
  cotton: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80",
  sugarcane: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=400&q=80",
  maize: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&q=80",
  chickpea: "https://images.unsplash.com/photo-1595855759920-86582356756a?auto=format&fit=crop&w=400&q=80",
  mustard: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=400&q=80",
  groundnut: "https://images.unsplash.com/photo-1595855759920-86582356756a?auto=format&fit=crop&w=400&q=80",
  soybean: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=400&q=80",
  bajra: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&q=80",
  jowar: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020d?auto=format&fit=crop&w=400&q=80",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80";

export function getCropImageUrl(cropName: string): string {
  const key = cropName.toLowerCase().trim().replace(/\s+/g, "");
  for (const [k, url] of Object.entries(CROP_IMAGES)) {
    if (key.includes(k) || k.includes(key)) return url;
  }
  return DEFAULT_IMAGE;
}

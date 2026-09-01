import { StylePreset } from '../types';
import { enrichPreset } from '../utils/tagExtractor';

export const INITIAL_SAMPLE_PRESETS_RAW: Omit<StylePreset, 'id' | 'createdAt'>[] = [
  {
    name: 'Cyberpunk Neon City',
    prompt: '{prompt}, cyberpunk aesthetic, neon glowing reflections, rain-slicked futuristic street, volumetric lighting, octane render, trending on artstation, sharp focus, 8k resolution, art by Syd Mead and Beeple',
    negative_prompt: 'blurry, low quality, oversaturated, deformed, out of focus, duplicate, watermark, signature',
    image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    favorite: true,
    combineCount: 72,
  },
  {
    name: 'Art Nouveau Elegance',
    prompt: '{prompt}, elegant art nouveau style, intricate organic floral filigree borders, gold leaf accents, delicate linework, pastel tones, masterpiece, by Alphonse Mucha and Gustav Klimt',
    negative_prompt: 'modern, photograph, 3d render, chaotic, dirty, messy background, lowres, bad anatomy',
    image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    favorite: true,
    combineCount: 48,
  },
  {
    name: 'Studio Ghibli Pastoral',
    prompt: '{prompt}, classic anime landscape, lush green hills, fluffy painterly cumulus clouds, peaceful atmosphere, vibrant nostalgic colors, Studio Ghibli style, directed by Hayao Miyazaki, gouache painting',
    negative_prompt: 'dark, gritty, photorealistic, 3d cgi, deformed, horror, ugly, low quality, signature',
    image_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    favorite: true,
    combineCount: 43,
  },
  {
    name: 'Epic Fantasy Oil',
    prompt: '{prompt}, dramatic fantasy scene, sweeping cinematic lighting, dynamic brushstrokes, rich oil on canvas texture, atmospheric god rays, art by Greg Rutkowski and Frank Frazetta, masterpiece',
    negative_prompt: 'flat colors, cartoon, 3d render, blurry, low resolution, bad hands, distorted faces',
    image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    favorite: false,
    combineCount: 36,
  },
  {
    name: 'Makoto Shinkai Anime Glow',
    prompt: '{prompt}, mesmerizing anime background, radiant sunset sky with shooting stars and lens flare, crystalline water reflections, highly detailed, by Makoto Shinkai and CoMix Wave Films, 8k resolution',
    negative_prompt: 'dull, muted colors, low resolution, pixelated, bad sketch, grainy, poorly drawn hands',
    image_url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    favorite: false,
    combineCount: 55,
  },
  {
    name: 'Moebius Sci-Fi Lineart',
    prompt: '{prompt}, retro sci-fi desert outpost, distinctive clean ligne claire ink lines, subtle flat watercolor wash, surreal alien architecture, vintage European comic book style, art by Moebius and Jean Giraud',
    negative_prompt: 'photorealistic, glossy 3d, dark shadows, photographic, cluttered, muddy colors',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    favorite: false,
    combineCount: 28,
  },
  {
    name: 'Unreal Engine 5 Hard-Surface Mech',
    prompt: '{prompt}, complex mechanical chassis, titanium armor panels, exposed hydraulic wires, ray tracing reflections, cinematic lighting, unreal engine 5, octane render, 8k, concept art by Vitaly Bulgarov',
    negative_prompt: 'organic, soft, blurry, low poly, toy-like, low resolution, plastic texture, bad anatomy',
    image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    favorite: false,
    combineCount: 31,
  },
  {
    name: 'Ukiyo-e Woodblock Print',
    prompt: '{prompt}, traditional Japanese woodblock print, bold ink contours, textured washi paper, natural mineral pigments, flowing waves and clouds, ukiyo-e style, art by Hokusai and Hiroshige',
    negative_prompt: 'modern, western, photograph, glossy 3d render, neon glow, blur, modern clothing',
    image_url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
    favorite: false,
    combineCount: 25,
  },
  {
    name: '3D Isometric Cozy Diorama',
    prompt: '{prompt}, miniature 3d isometric room diorama, tilt-shift lens effect, warm cozy ambient interior lighting, clay render materials, soft shadows, blender 3d, behance trending, octane render',
    negative_prompt: 'flat 2d, chaotic, realistic photo, harsh shadows, messy, distorted perspective, oversaturated',
    image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    favorite: true,
    combineCount: 21,
  },
  {
    name: 'Dark Gothic Surrealism',
    prompt: '{prompt}, haunting gothic monument, monumental towering structures, macabre eerie atmosphere, biomechanical bone motifs, muted sepia and ochre palette, art by Zdzislaw Beksinski and H.R. Giger',
    negative_prompt: 'bright, cheerful, cartoon, colorful, cute, anime, flat, sunny, low quality',
    image_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    favorite: false,
    combineCount: 42,
  },
  {
    name: 'Photorealistic Studio Portrait',
    prompt: 'award-winning portrait of {prompt}, shot on 85mm f/1.4 lens, natural skin texture with subtle pores, studio lighting with soft rim light, sharp focus on eyes, 8k resolution, photorealistic, masterpiece',
    negative_prompt: 'smooth plastic skin, doll look, airbrushed, cartoon, 3d render, bad eyes, extra fingers, bad teeth, blurry',
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    favorite: true,
    combineCount: 29,
  },
  {
    name: 'Retro 80s Synthwave Grid',
    prompt: '{prompt}, retro 80s synthwave aesthetic, wireframe perspective grid horizon, glowing magenta and cyan neon sun, starry cosmic sky, chrome reflections, vintage VHS tape artifact, digital illustration',
    negative_prompt: 'modern, monochrome, dull, low quality, oversaturated noise, deformed, daylight',
    image_url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
    favorite: false,
    combineCount: 24,
  },
  {
    name: 'Dreamy Ethereal Watercolor',
    prompt: '{prompt}, flowing soft watercolor painting, bleeding wet-on-wet paint edges, golden spatter droplets, translucent color layering, delicate romantic mood, art by James Jean and Victo Ngai',
    negative_prompt: 'harsh black outlines, 3d render, digital solid fills, dark, muddy, muddy colors, pixelated',
    image_url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
    favorite: false,
    combineCount: 38,
  },
  {
    name: 'WLOP Digital Fantasy Maiden',
    prompt: '{prompt}, breathtaking digital fantasy portrait, glowing bioluminescent light particles, ethereal flowing silk fabrics, dramatic rim lighting, highly detailed face and eyes, masterpiece, by WLOP and Artgerm',
    negative_prompt: 'deformed anatomy, bad hands, low resolution, blurry, dull lighting, amateur sketch, watermark',
    image_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
    favorite: false,
    combineCount: 33,
  },
  {
    name: 'Vintage Botanical Illustration',
    prompt: '{prompt}, antique 19th century botanical lithograph plate, aged parchment texture, scientific taxonomic annotations, copperplate engraving linework, muted hand-colored tinting, vintage naturalist book',
    negative_prompt: 'modern digital art, 3d, neon, glowing, glossy, camera lens blur, oversaturated',
    image_url: 'https://images.unsplash.com/photo-1507290439931-a861b5a38200?auto=format&fit=crop&w=800&q=80',
    favorite: false,
    combineCount: 17,
  },
  {
    name: 'Nordic Solitude Scenery',
    prompt: '{prompt}, vast foggy Scandinavian fjord landscape, minimalist composition, muted cool palette, lone cabin with glowing window, atmospheric mist, cinematic lighting, by Simon Stålenhag and Caspar David Friedrich',
    negative_prompt: 'crowded, tropical, oversaturated, neon, chaotic, blurry, cartoon, low resolution',
    image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    favorite: false,
    combineCount: 19,
  },
];

export function getInitialPresets(): StylePreset[] {
  return INITIAL_SAMPLE_PRESETS_RAW.map((item, idx) => {
    const raw: StylePreset = {
      ...item,
      id: `preset_init_${idx + 1}`,
      createdAt: Date.now() - (INITIAL_SAMPLE_PRESETS_RAW.length - idx) * 3600000,
    };
    return enrichPreset(raw);
  });
}

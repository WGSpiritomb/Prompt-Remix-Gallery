import { Palette, Sparkles, ImageOff } from 'lucide-react';

interface ArtworkPlaceholderProps {
  name: string;
  artists?: string[];
  tags?: string[];
  aspectRatio?: string;
  className?: string;
}

// Generate consistent visual palette based on name hash
function stringToColorPair(str: string): { bg1: string; bg2: string; accent: string } {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const palettes = [
    { bg1: '#091e3a', bg2: '#2b1055', accent: '#38bdf8' }, // Neon Cyber
    { bg1: '#2e1065', bg2: '#172554', accent: '#c084fc' }, // Violet Dream
    { bg1: '#022c22', bg2: '#134e4a', accent: '#34d399' }, // Emerald Nature
    { bg1: '#431407', bg2: '#78350f', accent: '#fbbf24' }, // Warm Sunset
    { bg1: '#18181b', bg2: '#3f3f46', accent: '#f43f5e' }, // Dark Crimson
    { bg1: '#1e1b4b', bg2: '#312e81', accent: '#818cf8' }, // Deep Indigo
    { bg1: '#1c1917', bg2: '#292524', accent: '#fb923c' }, // Ochre Fantasy
    { bg1: '#0f172a', bg2: '#1e293b', accent: '#22d3ee' }, // Slate Cyan
  ];

  const idx = Math.abs(hash) % palettes.length;
  return palettes[idx];
}

export function ArtworkPlaceholder({
  name,
  artists = [],
  tags = [],
  className = '',
}: ArtworkPlaceholderProps) {
  const { bg1, bg2, accent } = stringToColorPair(name);
  const primaryArtist = artists[0] || '';
  const primaryTag = tags[0] || '';

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between p-4 overflow-hidden select-none ${className}`}
      style={{
        background: `radial-gradient(circle at 80% 20%, ${bg2} 0%, ${bg1} 100%)`,
      }}
    >
      {/* Abstract geometric background elements */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`pattern-${name.replace(/\s+/g, '')}`} width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill={accent} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#pattern-${name.replace(/\s+/g, '')})`} />
        <circle cx="85%" cy="30%" r="90" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="20%" cy="80%" r="60" fill="none" stroke="white" strokeWidth="0.8" opacity="0.3" />
      </svg>

      {/* Top badges */}
      <div className="relative z-10 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1 text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded backdrop-blur-md border border-white/10"
          style={{ color: accent, backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <Sparkles className="w-2.5 h-2.5" />
          Style Preset
        </span>
        <Palette className="w-3.5 h-3.5 opacity-50 text-slate-400" />
      </div>

      {/* Center visual accent */}
      <div className="relative z-10 my-auto text-center py-2">
        <h4 className="text-xs font-bold text-slate-100 line-clamp-1 drop-shadow-sm px-2">
          {name}
        </h4>
        {primaryArtist ? (
          <p className="text-[11px] font-medium mt-0.5 line-clamp-1" style={{ color: accent }}>
            by {primaryArtist}
          </p>
        ) : primaryTag ? (
          <p className="text-slate-400 mt-0.5 uppercase tracking-wider text-[9px]">
            {primaryTag}
          </p>
        ) : (
          <p className="text-[10px] text-slate-400 mt-0.5">Prompt Blueprint</p>
        )}
      </div>

      {/* Bottom metadata tag */}
      <div className="relative z-10 flex items-center justify-between text-[9px] text-slate-400 border-t border-white/10 pt-1.5">
        <span className="truncate max-w-[120px] font-mono opacity-70">
          {tags.slice(0, 2).join(' • ') || 'Preset'}
        </span>
        <span className="text-slate-400 font-mono">styles.csv</span>
      </div>
    </div>
  );
}

export function ImageWithFallback({
  src,
  alt,
  name,
  artists,
  tags,
  className = '',
  onClick,
}: {
  src?: string;
  alt: string;
  name: string;
  artists?: string[];
  tags?: string[];
  className?: string;
  onClick?: () => void;
}) {
  if (!src) {
    return (
      <div onClick={onClick} className={`cursor-pointer overflow-hidden ${className}`}>
        <ArtworkPlaceholder name={name} artists={artists} tags={tags} />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative group overflow-hidden bg-[#161b22] cursor-pointer ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={(e) => {
          // Hide broken image and show fallback
          (e.target as HTMLElement).style.display = 'none';
          const parent = (e.target as HTMLElement).parentElement;
          if (parent) {
            const fallback = parent.querySelector('.fallback-container');
            if (fallback) (fallback as HTMLElement).style.display = 'block';
          }
        }}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="fallback-container hidden w-full h-full absolute inset-0">
        <ArtworkPlaceholder name={name} artists={artists} tags={tags} />
      </div>
    </div>
  );
}

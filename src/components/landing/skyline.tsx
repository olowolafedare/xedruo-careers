type Roof = "flat" | "spire" | "antenna" | "setback" | "steps";

type Building = { x: number; w: number; h: number; roof?: Roof };

/* Distant, hazy blocks */
const farBuildings: Building[] = [
  { x: -30, w: 96, h: 214 },
  { x: 72, w: 66, h: 262 },
  { x: 148, w: 54, h: 196 },
  { x: 412, w: 84, h: 238 },
  { x: 682, w: 92, h: 286 },
  { x: 782, w: 64, h: 224 },
  { x: 856, w: 58, h: 266 },
  { x: 920, w: 92, h: 208 },
];

/* Mid-ground towers: the main silhouette */
const midBuildings: Building[] = [
  { x: -14, w: 82, h: 258, roof: "flat" },
  { x: 72, w: 60, h: 206, roof: "antenna" },
  { x: 136, w: 86, h: 296, roof: "setback" },
  { x: 224, w: 52, h: 232, roof: "flat" },
  { x: 278, w: 74, h: 318, roof: "spire" },
  { x: 354, w: 56, h: 252, roof: "flat" },
  { x: 412, w: 84, h: 292, roof: "antenna" },
  { x: 500, w: 60, h: 228, roof: "steps" },
  { x: 562, w: 72, h: 278, roof: "setback" },
  { x: 636, w: 50, h: 208, roof: "flat" },
  { x: 688, w: 82, h: 262, roof: "antenna" },
  { x: 772, w: 58, h: 222, roof: "flat" },
  { x: 832, w: 92, h: 284, roof: "setback" },
  { x: 926, w: 58, h: 238, roof: "spire" },
  { x: 986, w: 60, h: 264, roof: "flat" },
];

/* Closer, crisper blocks that sit in front of the haze */
const nearBuildings: Building[] = [
  { x: 54, w: 76, h: 168, roof: "flat" },
  { x: 322, w: 62, h: 152, roof: "flat" },
  { x: 596, w: 70, h: 176, roof: "flat" },
  { x: 812, w: 86, h: 158, roof: "flat" },
  { x: 950, w: 74, h: 174, roof: "flat" },
];

function RoofDetail({ building, fill }: { building: Building; fill: string }) {
  const top = 400 - building.h;
  switch (building.roof) {
    case "setback":
      return (
        <>
          <rect x={building.x + building.w * 0.16} y={top - 24} width={building.w * 0.68} height={24} fill={fill} />
          <rect x={building.x + building.w * 0.3} y={top - 40} width={building.w * 0.4} height={16} fill={fill} />
        </>
      );
    case "spire":
      return (
        <>
          <rect x={building.x + building.w / 2 - 7} y={top - 26} width={14} height={26} fill={fill} />
          <rect x={building.x + building.w / 2 - 2} y={top - 58} width={4} height={34} fill={fill} />
        </>
      );
    case "antenna":
      return (
        <>
          <rect x={building.x + building.w * 0.22} y={top - 12} width={building.w * 0.56} height={12} fill={fill} />
          <rect x={building.x + building.w * 0.68} y={top - 34} width={3} height={24} fill={fill} />
        </>
      );
    case "steps":
      return (
        <>
          <rect x={building.x + 6} y={top - 14} width={building.w - 22} height={14} fill={fill} />
          <rect x={building.x + 14} y={top - 26} width={building.w - 40} height={12} fill={fill} />
        </>
      );
    default:
      return (
        <rect
          x={building.x + building.w * 0.28}
          y={top - 9}
          width={building.w * 0.3}
          height={9}
          fill={fill}
        />
      );
  }
}

function Layer({
  buildings,
  fill,
  windows,
  windowOpacity,
  filter,
}: {
  buildings: Building[];
  fill: string;
  windows?: string;
  windowOpacity?: number;
  filter?: string;
}) {
  return (
    <g filter={filter}>
      {buildings.map((building, index) => {
        const top = 400 - building.h;
        return (
          <g key={`${building.x}-${index}`}>
            <rect x={building.x} y={top} width={building.w} height={building.h} fill={fill} />
            <RoofDetail building={building} fill={fill} />
            {windows ? (
              <rect
                x={building.x + 5}
                y={top + 12}
                width={Math.max(building.w - 10, 0)}
                height={Math.max(building.h - 18, 0)}
                fill={windows}
                opacity={windowOpacity ?? 0.55}
              />
            ) : null}
          </g>
        );
      })}
    </g>
  );
}

export default function Skyline({
  className = "",
  idPrefix = "xedruo",
  variant = "hero",
}: {
  className?: string;
  idPrefix?: string;
  variant?: "hero" | "panel";
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1024 400"
      preserveAspectRatio="xMidYMax slice"
      className={className}
    >
      <defs>
        <linearGradient id={`${idPrefix}-skyline-mid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D6E5FE" />
          <stop offset="46%" stopColor="#C7DCFC" />
          <stop offset="100%" stopColor="#B3CDFA" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-skyline-near`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9DEFD" />
          <stop offset="100%" stopColor="#AFCBFA" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-skyline-arrow`} x1="0" y1="1" x2="0.4" y2="0">
          <stop offset="0%" stopColor="#6E9AEE" />
          <stop offset="100%" stopColor="#ABC8FA" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-skyline-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F3F8FF" stopOpacity="0.85" />
          <stop offset="16%" stopColor="#F3F8FF" stopOpacity="0.28" />
          <stop offset="34%" stopColor="#F3F8FF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-skyline-base`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#AECBFA" stopOpacity="0" />
          <stop offset="100%" stopColor="#9FC2F8" stopOpacity="0.45" />
        </linearGradient>
        <pattern
          id={`${idPrefix}-windows`}
          width="13"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <rect x="3" y="4" width="5.5" height="7.5" rx="1" fill="#FCFEFF" opacity="0.92" />
        </pattern>
        <pattern
          id={`${idPrefix}-windows-near`}
          width="17"
          height="21"
          patternUnits="userSpaceOnUse"
        >
          <rect x="4" y="5" width="8" height="10" rx="1" fill="#F7FBFF" opacity="0.9" />
        </pattern>
        <filter id={`${idPrefix}-skyline-blur`}>
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>

      {variant === "hero" ? (
        <Layer
          buildings={farBuildings}
          fill="#DCE9FE"
          filter={`url(#${idPrefix}-skyline-blur)`}
        />
      ) : null}

      <Layer
        buildings={midBuildings}
        fill={`url(#${idPrefix}-skyline-mid)`}
        windows={`url(#${idPrefix}-windows)`}
        windowOpacity={0.62}
      />

      <Layer
        buildings={nearBuildings}
        fill={`url(#${idPrefix}-skyline-near)`}
        windows={`url(#${idPrefix}-windows-near)`}
        windowOpacity={0.5}
      />

      {variant === "hero" ? (
        <g transform="translate(692 132) rotate(38)">
          <path
            d="M-15 96 L-15 -2 L-46 -2 L0 -74 L46 -2 L15 -2 L15 96 Z"
            fill={`url(#${idPrefix}-skyline-arrow)`}
            opacity="0.95"
          />
          <path
            d="M-3 96 L-3 8 L-27 8 L0 -44 L27 8 L3 8 L3 96 Z"
            fill="#F6FAFF"
            opacity="0.18"
          />
        </g>
      ) : null}

      <rect width="1024" height="400" fill={`url(#${idPrefix}-skyline-base)`} />
      <rect width="1024" height="400" fill={`url(#${idPrefix}-skyline-haze)`} />
    </svg>
  );
}

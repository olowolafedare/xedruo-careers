const buildings = [
  { x: 0, y: 214, w: 62, h: 106 },
  { x: 62, y: 244, w: 52, h: 76 },
  { x: 126, y: 158, w: 74, h: 162 },
  { x: 210, y: 222, w: 44, h: 98 },
  { x: 262, y: 122, w: 58, h: 198 },
  { x: 330, y: 184, w: 48, h: 136 },
  { x: 386, y: 92, w: 78, h: 228 },
  { x: 474, y: 228, w: 42, h: 92 },
  { x: 522, y: 146, w: 66, h: 174 },
  { x: 596, y: 198, w: 54, h: 122 },
  { x: 658, y: 108, w: 74, h: 212 },
  { x: 740, y: 178, w: 58, h: 142 },
  { x: 806, y: 138, w: 94, h: 182 },
];

export default function Skyline({
  className = "",
  idPrefix = "xedruo",
}: {
  className?: string;
  idPrefix?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 900 320"
      preserveAspectRatio="none"
      className={className}
    >
      <defs>
        <linearGradient id={`${idPrefix}-skyline`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8DBFB" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#B4CCF7" stopOpacity="0.92" />
        </linearGradient>
        <pattern
          id={`${idPrefix}-skyline-windows`}
          width="18"
          height="22"
          patternUnits="userSpaceOnUse"
        >
          <rect
            x="4"
            y="5"
            width="6"
            height="8"
            rx="1"
            fill="#F6FAFF"
            opacity="0.55"
          />
        </pattern>
      </defs>
      <g>
        {buildings.map((building, index) => (
          <g key={`${building.x}-${index}`}>
            <rect
              x={building.x}
              y={building.y}
              width={building.w}
              height={building.h}
              rx="4"
              fill={`url(#${idPrefix}-skyline)`}
            />
            <rect
              x={building.x + 6}
              y={building.y + 8}
              width={Math.max(building.w - 12, 0)}
              height={Math.max(building.h - 14, 0)}
              fill={`url(#${idPrefix}-skyline-windows)`}
              opacity="0.65"
            />
          </g>
        ))}
        <rect x="412" y="60" width="4" height="34" rx="2" fill="#C2D7FB" />
        <rect x="683" y="80" width="4" height="30" rx="2" fill="#C2D7FB" />
      </g>
    </svg>
  );
}

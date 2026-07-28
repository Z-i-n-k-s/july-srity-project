const Logo = ({ w = 200, h = 60, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={w}
    height={h}
    viewBox="0 0 500 150"
    {...props}
  >
    {/* Blue icon background */}
    <rect x="0" y="15" width="120" height="120" rx="15" fill="#2563EB" />

    {/* Dollar sign */}
    <text
      x="20"
      y="55"
      fontSize="32"
      fontWeight="bold"
      fill="#fff"
      fontFamily="Arial, sans-serif"
    >
      $
    </text>

    {/* Chart line */}
    <polyline
      points="25,95 55,70 85,85"
      fill="none"
      stroke="#fff"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="25" cy="95" r="5" fill="#fff" />
    <circle cx="55" cy="70" r="5" fill="#fff" />
    <circle cx="85" cy="85" r="5" fill="#fff" />

    {/* Text: Finance Tracker */}
    <text
      x="140"
      y="70"
      fontSize="36"
      fontWeight="bold"
      fill="#1E293B"
      fontFamily="Arial, sans-serif"
    >
      Finance
    </text>
    <text
      x="140"
      y="110"
      fontSize="36"
      fontWeight="bold"
      fill="#1E293B"
      fontFamily="Arial, sans-serif"
    >
      Tracker
    </text>
  </svg>
);

export default Logo;

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="stardrop-mark" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFC24B" />
          <stop offset="0.5" stopColor="#FF9D3D" />
          <stop offset="1" stopColor="#FF5C77" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="12" fill="url(#stardrop-mark)" />
      {/* A four-point "star drop" sparkle */}
      <path
        d="M20 9c.9 5.2 2.9 7.2 8.1 8.1.6.1.6.9 0 1C22.9 19 20.9 21 20 26.2c-.1.6-.9.6-1 0-.9-5.2-2.9-7.2-8.1-8.1-.6-.1-.6-.9 0-1 5.2-.9 7.2-2.9 8.1-8.1.1-.6.9-.6 1 0Z"
        fill="#FFF8EC"
      />
      <circle cx="28.5" cy="28.5" r="2.4" fill="#FFF8EC" opacity="0.85" />
    </svg>
  );
}

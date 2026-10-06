export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect x="2" y="2" width="28" height="28" rx="8" stroke="#4f9cff" strokeOpacity=".6" />
        <rect x="9" y="12" width="3.5" height="10" rx="1.75" fill="#64d7ff" />
        <rect x="14.25" y="8" width="3.5" height="16" rx="1.75" fill="#4f9cff" />
        <rect x="19.5" y="15" width="3.5" height="7" rx="1.75" fill="#8f7aff" />
      </svg>
      <span className="leading-none">
        <span className="block text-[15px] font-semibold tracking-tight">CampusFlow</span>
        <span className="mt-1 block text-xs text-faint">AI campus operations</span>
      </span>
    </span>
  )
}

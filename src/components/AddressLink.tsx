'use client';

export function shortenAddress(addr: string, chars = 4): string {
  if (!addr || addr.length < chars * 2 + 2) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function AddressLink({
  address,
  onClick,
  className = '',
}: {
  address: string;
  onClick?: (address: string) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(address)}
      className={`font-mono text-accent/80 hover:text-accent hover:underline cursor-pointer transition-colors ${className}`}
      title={address}
    >
      {shortenAddress(address)}
    </button>
  );
}

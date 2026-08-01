import Image from "next/image";

/** Shared PFS wordmark, sized consistently wherever it's used (storefront + admin headers). */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`relative block h-9 w-24 sm:h-10 sm:w-28 ${className}`}>
      <Image src="/logo.svg" alt="PFS" fill className="object-contain" />
    </span>
  );
}

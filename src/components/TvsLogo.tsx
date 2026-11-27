import logo from "@/assets/tvs-logo.png";

export function TvsLogo({ className = "h-6 w-auto", chip = false }: { className?: string; chip?: boolean }) {
  const img = <img src={logo} alt="TVS" className={className} />;
  if (!chip) return img;
  return <span className="inline-flex shrink-0 items-center rounded-md bg-white px-2 py-1">{img}</span>;
}

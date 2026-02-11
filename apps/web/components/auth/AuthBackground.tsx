export default function AuthBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* grid */}
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--grid) / 0.03) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--grid) / 0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* blobs */}
      <div
        className="absolute -top-[30%] -right-[20%] h-[800px] w-[800px] rounded-full blur-[80px]"
        style={{ background: "radial-gradient(circle, rgb(var(--primary) / 0.06) 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-[20%] -left-[10%] h-[600px] w-[600px] rounded-full blur-[60px]"
        style={{ background: "radial-gradient(circle, rgb(6 214 160 / 0.04) 0%, transparent 70%)" }}
      />

      {/* floating particles */}
      <div
        className="absolute left-[15%] top-[20%] h-[3px] w-[3px] animate-pulse rounded-full bg-primary opacity-40"
        style={{ animationDuration: "3s" }}
      />
      <div
        className="absolute right-[25%] top-[60%] h-[2px] w-[2px] animate-pulse rounded-full bg-accent opacity-30"
        style={{ animationDuration: "4s", animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-[30%] left-[40%] h-[2px] w-[2px] animate-pulse rounded-full bg-primaryHover opacity-35"
        style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}
      />
    </div>
  );
}

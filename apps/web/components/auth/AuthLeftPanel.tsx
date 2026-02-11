import Logo from "../ui/Logo";

const features = [
  { i: "📦", t: "Ürün & Varyant Yönetimi", d: "Renk, boyut ve daha fazlası ile kapsamlı ürün tanımlama" },
  { i: "🏪", t: "Çoklu Mağaza Desteği", d: "Tenant bazlı mağaza, kullanıcı ve stok yönetimi" },
  { i: "📊", t: "Gerçek Zamanlı Raporlar", d: "Satış, stok ve transfer analizleri anlık olarak" },
  { i: "📱", t: "Mobil Barkod Tarama", d: "Hızlı ürün giriş ve çıkış işlemleri" },
];

const stats = [
  { n: "10K+", l: "Aktif Kullanıcı" },
  { n: "50M+", l: "İşlem / Ay" },
  { n: "99.9%", l: "Uptime" },
];

export default function AuthLeftPanel() {
  return (
    <div className="h-full flex items-center justify-center px-14">
      <div className="max-w-[420px]">
        <div className="mb-12">
          <Logo />
        </div>

        <h1 className="text-[36px] font-bold leading-[1.2] tracking-tight">
          Stok yönetiminde
          <br />
          <span className="text-primary">yeni nesil</span> çözüm.
        </h1>

        <p className="mt-4 text-[15px] leading-[1.7] text-muted">
          Depo, market ve mağaza zincirlerinizi tek platformdan yönetin.
          Ürün, stok, transfer ve satışlarınızı gerçek zamanlı takip edin.
        </p>

        <div className="mt-12 flex flex-col gap-6">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="flex gap-3.5 items-start animate-fi"
              style={{ animationDelay: `${0.2 + idx * 0.2}s` }}
            >
              <div className="h-10 w-10 rounded-[10px] bg-primary/10 flex items-center justify-center text-lg shrink-0">
                {f.i}
              </div>
              <div>
                <div className="text-[14px] font-semibold leading-tight">{f.t}</div>
                <div className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{f.d}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-[14px] border border-border bg-surface p-2">
          <div className="flex justify-between">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center">
                {i > 0 && <div className="mx-0 h-8 w-px bg-border" />}
                <div
                  className="px-4 py-4 text-center animate-fi"
                  style={{ animationDelay: `${1 + i * 0.2}s` }}
                >
                  <div className="text-[26px] font-bold tracking-tight text-primary leading-none">
                    {s.n}
                  </div>
                  <div className="mt-1 text-[11px] tracking-wide text-muted">{s.l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

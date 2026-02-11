"use client";

export default function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  let s = 0;
  if (password.length >= 8) s++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++;
  if (/\d/.test(password)) s++;
  if (/[^a-zA-Z0-9]/.test(password)) s++;

  const map = [
    null,
    { l: "Zayıf", cl: "bg-error text-error" },
    { l: "Orta", cl: "bg-warning text-warning" },
    { l: "İyi", cl: "bg-blue-500 text-blue-500" },
    { l: "Güçlü", cl: "bg-primary text-primary" },
  ] as const;

  const data = map[s];
  if (!data) return null;

  const barColor =
    s === 1 ? "bg-error" : s === 2 ? "bg-warning" : s === 3 ? "bg-blue-500" : "bg-primary";

  return (
    <div className="-mt-3 mb-5">
      <div className="mb-1 flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-[3px] flex-1 rounded-sm ${i <= s ? barColor : "bg-border"} transition-all duration-300`}
          />
        ))}
      </div>
      <div className={`text-right text-[11px] font-medium ${data.cl.split(" ")[1]}`}>{data.l}</div>
    </div>
  );
}

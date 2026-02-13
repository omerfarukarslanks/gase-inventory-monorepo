"use client";

type Props = {
  label: string;
  type?: "button" | "submit" | "reset";
  className?: string;
  buttonType?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  form?: string;
};

export default function Button({
  label,
  type = "button",
  className = "font-semibold  hover:opacity-90",
  buttonType = "primary",
  disabled = false,
  loading = false,
  onClick,
  form,
}: Props) {

  return (
    <button
      type={type}
      onClick={onClick}
      form={form}
      disabled={disabled || loading}
      className={`${className} text-${buttonType}  ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {loading ? (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-sp">
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="3" />
            <path d="M12 2a10 10 0 019.95 9" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>{label}</span>
        </>
      ) : <span>{label}</span>}

    </button>
  );
}

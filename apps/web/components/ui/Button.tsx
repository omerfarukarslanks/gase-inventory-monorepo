"use client";

type Props = {
    label: string;
    type?: "button" | "submit" | "reset";
    className?: string;
    buttonType?: "primary" | "secondary" | "ghost";
    disabled?: boolean;
    onClick?: () => void;
}

export default function Button({ label, type = "button", className = "font-semibold cursor-pointer hover:opacity-90", buttonType = "primary", disabled = false, onClick }: Props) {

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${className} text-${buttonType}  ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span>{label}</span>
    </button>
  );
}
type FieldErrorProps = {
  error?: string;
  className?: string;
};

export function FieldError({ error, className }: FieldErrorProps) {
  if (!error) return null;
  return <p className={className ?? "text-xs text-error"}>{error}</p>;
}

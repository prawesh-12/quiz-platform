import { theme } from "@/theme";

const BORDER_WIDTH_PX = 2;

export default function Spinner({ size = 18, className = "", label = "" }) {
  return (
    <div
      className={`flex items-center justify-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label || "Loading"}
    >
      <span
        className="inline-block animate-spin rounded-full"
        style={{
          width: size,
          height: size,
          borderWidth: BORDER_WIDTH_PX,
          borderStyle: "solid",
          borderColor: theme.border.default,
          borderTopColor: theme.accent.DEFAULT
        }}
        aria-hidden="true"
      />
      {label ? (
        <span className="text-[12px] font-medium" style={{ color: theme.text.muted }}>
          {label}
        </span>
      ) : null}
    </div>
  );
}

export default function Spinner({ size = 18, className = "", label = "" }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`} role="status" aria-live="polite">
      <span
        className="inline-block animate-spin rounded-full border-2"
        style={{ width: size, height: size, borderColor: "#ECECEC", borderTopColor: "#1C1C1E" }}
        aria-hidden="true"
      />
      {label ? (
        <span className="text-[12px]" style={{ color: "#999999", fontWeight: 500 }}>
          {label}
        </span>
      ) : null}
    </div>
  );
}

import { BookOpen } from "lucide-react";

export default function LoadingScreen({ message = "Loading...", slowNotice = "" }) {
  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center"
      style={{ backgroundColor: "#EAEAEC", fontFamily: "'Inter', sans-serif" }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px]"
          style={{ background: "#1C1C1E", color: "#FFFFFF" }}
        >
          <BookOpen className="h-[18px] w-[18px]" />
        </span>
        <span
          className="leading-none"
          style={{ fontSize: "20px", fontWeight: 700, color: "#1C1C1E", letterSpacing: "-0.3px" }}
        >
          QuizLoom
        </span>
      </div>

      <div
        className="mt-6 h-8 w-8 rounded-full border-[3px] animate-spin"
        style={{ borderColor: "#F0F0F0", borderTopColor: "#1C1C1E" }}
        aria-hidden="true"
      />

      <p className="mt-4 text-[13px]" style={{ color: "#999999", fontWeight: 500 }}>
        {message}
      </p>

      {slowNotice ? (
        <p className="mt-1 text-[12px]" style={{ color: "#AAAAAA" }}>
          {slowNotice}
        </p>
      ) : null}
    </div>
  );
}

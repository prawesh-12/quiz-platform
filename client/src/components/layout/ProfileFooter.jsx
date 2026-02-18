import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function ProfileFooter({ user, onLogout, onOpenProfile }) {
  const initials = (user?.name || "T")
    .split(" ")
    .slice(0, 2)
    .map((token) => token.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_16px_32px_rgba(7,10,24,0.35)] backdrop-blur-sm">
        <button
          type="button"
          className="flex min-w-0 items-center gap-3 text-left"
          onClick={() => onOpenProfile?.()}
        >
          <Avatar className="h-10 w-10 border border-white/20">
            <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || "Teacher"} />
            <AvatarFallback className="bg-[#2e3350] text-slate-100">
              {initials || "T"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-100">
              {user?.name || "Teacher"}
            </p>
            <p className="truncate text-xs text-slate-300">{user?.email || ""}</p>
          </div>
        </button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg border-white/25 bg-transparent text-slate-100 hover:bg-white/10 hover:text-white"
          onClick={onLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}

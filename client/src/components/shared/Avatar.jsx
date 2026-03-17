import { useEffect, useMemo, useState } from "react";

import { api } from "@/services/api";
import { cn } from "@/lib/utils";

const COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-teal-500"
];

const SIZE_CLASS_MAP = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-xl"
};

export default function Avatar({ teacherId, name, size = "md", hasAvatar = false, imageSrc, className }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState(imageSrc || null);

  useEffect(() => {
    setImageFailed(false);
  }, [teacherId, hasAvatar, imageSrc]);

  useEffect(() => {
    let ignore = false;
    let objectUrl = null;

    async function resolveImageSource() {
      if (imageSrc) {
        setResolvedSrc(imageSrc);
        return;
      }

      if (!hasAvatar || !teacherId) {
        setResolvedSrc(null);
        return;
      }

      try {
        const response = await api.get(`/teachers/${teacherId}/avatar`, {
          responseType: "blob",
          skipErrorToast: true
        });

        objectUrl = URL.createObjectURL(response.data);
        if (!ignore) {
          setResolvedSrc(objectUrl);
        }
      } catch {
        if (!ignore) {
          setResolvedSrc(null);
          setImageFailed(true);
        }
      }
    }

    resolveImageSource();

    return () => {
      ignore = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [hasAvatar, imageSrc, teacherId]);

  const initials = useMemo(() => {
    const normalizedName = String(name || "").trim();
    if (!normalizedName) {
      return "?";
    }

    return normalizedName
      .split(/\s+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [name]);

  const colorClass = useMemo(() => {
    const normalizedName = String(name || "");
    const charCode = normalizedName ? normalizedName.charCodeAt(0) : 0;
    return COLORS[charCode % COLORS.length];
  }, [name]);

  const sizeClass = SIZE_CLASS_MAP[size] || SIZE_CLASS_MAP.md;
  const src = resolvedSrc;

  if (src && !imageFailed) {
    return (
      <img
        src={src}
        alt={name || "Teacher"}
        className={cn("rounded-full object-cover", sizeClass, className)}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        colorClass,
        sizeClass,
        className
      )}
    >
      {initials}
    </div>
  );
}

import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";

const DEFAULT_SCHOOLS = ["SOT", "SLS", "SOET"];

function normalizeSchool(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toUpperCase();
}

function getSchoolFromPath(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const schoolsIndex = parts.findIndex((part) => part === "schools");
  if (schoolsIndex === -1) {
    return "";
  }

  return normalizeSchool(parts[schoolsIndex + 1]);
}

export default function SchoolTabs({
  value,
  onChange,
  schools = DEFAULT_SCHOOLS,
  basePath = "/admin/schools",
  className
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const normalizedSchools = useMemo(
    () => schools.map((school) => normalizeSchool(school)).filter(Boolean),
    [schools]
  );

  const activeSchool = useMemo(() => {
    const fromProp = normalizeSchool(value);
    if (fromProp && normalizedSchools.includes(fromProp)) {
      return fromProp;
    }

    const fromPath = getSchoolFromPath(location.pathname);
    if (fromPath && normalizedSchools.includes(fromPath)) {
      return fromPath;
    }

    return normalizedSchools[0] ?? "";
  }, [location.pathname, normalizedSchools, value]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {normalizedSchools.map((school) => {
        const isActive = activeSchool === school;
        return (
          <button
            key={school}
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full px-4 py-1 text-[13px] font-medium transition-colors",
              isActive ? "bg-black text-white" : "border border-gray-300 text-gray-700"
            )}
            onClick={() => {
              onChange?.(school);
              if (!onChange) {
                navigate(`${basePath}/${school}`);
              }
            }}
          >
            {school}
          </button>
        );
      })}
    </div>
  );
}

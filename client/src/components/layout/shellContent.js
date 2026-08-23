const DASHBOARD_PATHS = ["/teacher", "/admin"];
const DASHBOARD_PADDING = "24px 28px";

const DEFAULT_CONTENT = {
  isScrollable: true,
  paddingClass: "",
  style: undefined
};

// Dashboards own their scrolling: the region is a fixed-height flex column, never a scroller.
const DASHBOARD_CONTENT = {
  isScrollable: false,
  paddingClass: "h-full",
  style: {
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    padding: DASHBOARD_PADDING,
    boxSizing: "border-box"
  }
};

// Derived from the path so the first paint is already correct — no post-mount layout shift.
export function resolveShellContent(pathname) {
  if (DASHBOARD_PATHS.includes(pathname)) {
    return DASHBOARD_CONTENT;
  }

  return DEFAULT_CONTENT;
}

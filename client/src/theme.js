export const theme = {
  // Colors
  bg: {
    page: '#EAEAEC',           // outer page background
    app: '#FFFFFF',            // main app shell card
    content: '#FAFAFA',        // main content area
    sidebar: '#FFFFFF',        // sidebar
    card: '#FFFFFF',           // all white cards
    cardHover: '#FAFAFA',      // card/row hover
    input: '#F4F4F5',          // search bar, input fills
    muted: '#F7F7F7',          // subtle section backgrounds
    activeNav: '#1C1C1E',      // active sidebar item
    cta: '#E8442A',            // primary action button (coral red)
  },
  text: {
    primary: '#1C1C1E',        // headings, bold values
    secondary: '#3A3A3A',      // body text
    muted: '#999999',          // labels, placeholders
    subtle: '#AAAAAA',         // axis labels, IDs
    white: '#FFFFFF',
    accent: '#E8442A',         // coral red text
    teal: '#1A9E9E',
    green: '#27A85A',
    orange: '#D4793A',
  },
  border: {
    default: '#EBEBEB',        // card borders
    light: '#F4F4F4',          // row dividers
    input: '#E4E4E4',          // button/input borders
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '14px',
    xxl: '20px',
    full: '9999px',
  },
  shadow: {
    app: '0 8px 40px rgba(0,0,0,0.10)',   // floating app shell
    card: '0 1px 4px rgba(0,0,0,0.06)',   // subtle card shadow
    tooltip: '0 4px 20px rgba(0,0,0,0.12)',
  },
  font: {
    family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    size: { xs: '11px', sm: '12px', base: '13px', md: '14px', lg: '15px', xl: '24px', stat: '28px' },
    weight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
  sidebar: { width: '240px' },
  spacing: { cardPad: '20px 24px', sectionGap: '16px', rowHeight: '52px' },
  badge: {
    teal:   { bg: '#E6F7F7', color: '#1A9E9E' },
    gray:   { bg: '#F2F2F2', color: '#666666' },
    green:  { bg: '#E8F7EE', color: '#27A85A' },
    orange: { bg: '#FEF3EC', color: '#D4793A' },
    blue:   { bg: '#F0F3FF', color: '#4B6BFB' },
    red:    { bg: '#FFE8E8', color: '#E8442A' },
  },
}

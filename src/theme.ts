// The deck's palette, in one place.
//
// It lives here rather than in `deck.tsx` because it has two consumers and
// they are not the same program. The deck plants it with a `<ThemeProvider>`;
// the **workbench** has to plant the same one, or a component previewed there
// is previewed in a palette the talk never shows — and the difference is not
// subtle, because with no provider at all react-x11 follows the *desktop*,
// accent and all. A control that is blue on the projector comes up in
// whatever colour the presenter set in System Settings, and a menu that drops
// out of a `<Select>` comes up in the library's defaults.
//
// Dark and pinned: a projector is not a desktop, and the one thing a deck
// must not do is change colour because the machine it is plugged into has
// opinions.
export const DECK_THEME = {
  background: '#0e1116',
  surface: '#161b22',
  border: '#2a3038',
  text: '#e6edf3',
  textMuted: '#8b949e',
  accent: '#58a6ff',
};

// The hot-reload demo's entry: it mounts, and that is all it does.
//
//   node --enable-source-maps --import react-x11/refresh/register \
//     examples/hot-demo.jsx
//
// The file to *edit* is `hot-demo-app.jsx` next to it, and the split is the
// rule rather than a preference. A module is a refresh boundary when every
// one of its exports is a component: an edit to it re-evaluates that module
// and stops there. This one exports nothing and mounts a window as a side
// effect, so it must never be re-evaluated — running it twice would open a
// second window. Keeping the mount here and the components there is what
// makes the boundary land in the right place.
import React from 'react';
import ReactX11 from 'react-x11';

import App from './hot-demo-app.jsx';

// `createRoot` through the default export: hot-module-replacement rewrites
// named imports into live bindings it fills in a microtask, so a named
// import called at module top level is still undefined when the line runs.
const root = await ReactX11.createRoot();
root.render(<App />);

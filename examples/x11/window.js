// The smallest thing you can see: one window, and nothing else.
//
//   DISPLAY=127.0.0.1:1 node examples/x11/window.js
//
// On the wire that is a connection handshake and then four requests, not one
// of which has a reply. The window id is not asked for either: `AllocID`
// hands out an id from the range the server gave this connection during the
// handshake, so `CreateWindow` can name a window that does not exist yet
// without a round trip.
import x11 from 'x11';

x11.createClient((err, display) => {
  if (err) throw err;
  const X = display.client;
  const screen = display.screen[0];
  const wid = X.AllocID();

  // id, parent, x, y, width, height, border, depth, class, visual, values
  X.CreateWindow(wid, screen.root, 120, 120, 360, 240, 0, 0, 0, 0, {
    backgroundPixel: screen.white_pixel,
  });
  X.MapWindow(wid);

  X.on('error', (e) => console.error(e));
});

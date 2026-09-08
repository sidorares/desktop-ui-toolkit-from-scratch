// The same window, with one bit added to its value list.
//
//   DISPLAY=127.0.0.1:1 node examples/x11/mousedown.js
//
// `eventMask` is a 32-bit set: asking for ButtonPress costs four bytes in
// the same CreateWindow, and nothing else — no listener registration, no
// second request. Click the window and the server sends back a 32-byte
// event, unasked and unnumbered, which is the half of the protocol that is
// not request/reply at all.
import x11 from 'x11';

const { ButtonPress } = x11.eventMask;

x11.createClient((err, display) => {
  if (err) throw err;
  const X = display.client;
  const screen = display.screen[0];
  const wid = X.AllocID();

  X.CreateWindow(wid, screen.root, 120, 120, 360, 240, 0, 0, 0, 0, {
    backgroundPixel: screen.white_pixel,
    eventMask: ButtonPress,
  });
  X.MapWindow(wid);

  X.on('event', (ev) => console.log(ev.name, ev.x, ev.y));
  X.on('error', (e) => console.error(e));
});

// Three shapes of request, so the byte view has something to say.
//
//   DISPLAY=127.0.0.1:1 node examples/x11/title.js
//
// `CreateWindow` carries a value list — a mask, then one 32-bit value per
// bit set, in mask order. `ChangeProperty` carries a *string*, in 8-bit
// units, padded up to the next multiple of four: eleven characters, one
// pad byte, and a length field that counts the characters rather than the
// padding. `GetGeometry` is the only one here that asks a question, and its
// reply carries the sequence number of the request that asked it — which is
// how the visualizer pairs the two.
import x11 from 'x11';

x11.createClient((err, display) => {
  if (err) throw err;
  const X = display.client;
  const screen = display.screen[0];
  const wid = X.AllocID();

  X.CreateWindow(wid, screen.root, 120, 120, 360, 240, 0, 0, 0, 0, {
    backgroundPixel: screen.black_pixel,
  });
  X.ChangeProperty(0, wid, X.atoms.WM_NAME, X.atoms.STRING, 8, 'on the wire');
  X.MapWindow(wid);

  X.GetGeometry(wid, (err, geometry) => console.log(geometry));

  X.on('error', (e) => console.error(e));
});

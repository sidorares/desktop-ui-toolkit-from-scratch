// `<Booking>` — a flight booking that reads the desktop's calendar.
//
// `events` is the seam and the reason this has stories: on the slide it is a
// fixture, in an application it is `useDesktopCalendarEvents().events`, and
// the only way to know the grid cannot tell the two apart is to feed it
// several shapes. An empty array is the machine with no calendar service —
// which is most machines, and the state the demo must not look broken in.
import { story } from '@react-x11/workbench/story';

import { Booking, MELBJS } from '../src/components/booking.js';

export default { title: 'Booking', size: { width: 1180, height: 560 } };

/** What the slide shows: a trip that already covers the evening of the talk. */
export const asOnTheSlide = () => <Booking height={480} />;

/** No calendar service, no events — and nothing on screen that says "error". */
export const noCalendar = () => <Booking height={480} events={[]} />;

/** A busier week, which is what a real calendar looks like: the day cells cap
 *  at three dots and the panel lists whatever the range covers. */
export const busyWeek = () => (
  <Booking
    height={480}
    events={[
      MELBJS,
      {
        ...MELBJS,
        uid: 'standup@example',
        summary: 'Standup',
        start: new Date('2026-09-09T09:30:00'),
        end: new Date('2026-09-09T09:45:00'),
        calendar: { uid: 'work', name: 'Work', color: '#3fb950' },
      },
      {
        ...MELBJS,
        uid: 'flight-review@example',
        summary: 'Design review',
        start: new Date('2026-09-10T14:00:00'),
        end: new Date('2026-09-10T15:00:00'),
        calendar: { uid: 'work', name: 'Work', color: '#3fb950' },
      },
    ]}
  />
);

export const playground = story(
  (args: { height: number }) => <Booking {...args} />,
  {
    args: { height: 480 },
    controls: { height: { type: 'number', min: 260, max: 620, step: 20 } },
  },
);

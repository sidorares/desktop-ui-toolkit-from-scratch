// A flight booking that knows what is already in your week.
//
// The component on the slide is `<Calendar>` — a month grid, a range, days
// the airline has no seats on. The *point* of the slide is the dots: they are
// the user's real calendar, and the application never asked for a credential,
// never ran an OAuth flow and never saw a token. The desktop did all of that
// years ago, and `useDesktopCalendarEvents()` reads the result over D-Bus
// from Evolution Data Server — which is where Google, Microsoft, CalDAV and
// local calendars have already been federated for every other app on the
// machine. A web page in the same position starts by asking for your Google
// password.
//
// **`events` is that hook's output, as a prop.** The whole integration comes
// out of the `dayContent` seam, and a seam takes whatever shape it is given —
// so a slide can hand it a fixture and the grid cannot tell the difference.
// That is why this demo needs no calendar service configured on the laptop it
// is presented from, and it is not a cheat: the shape below *is*
// `useDesktopCalendarEvents().events`, down to the `byDay` grouping, which is
// the library's own function.
//
// That import moved. It was `@react-x11/components/desktop-calendar` until
// components 0.4.0; react-x11 2.9.1 promoted the D-Bus half into **core** and
// dropped the subpath, because reading the user's calendar is one of the
// things an app does *outside* its own windows — like notifications, the tray
// and the file dialog — and every one of those is a ladder in core with a
// freedesktop rung and a macOS one. The macOS rung reaches EventKit through
// `@windowkit/appkit`, which only core can see.
//
// Which is slide 26's loop, having happened to this file: drafted in an app,
// found to be the thing every app would write itself, promoted. Nothing else
// changed — the migration was these two import lines.
//
// The booking rules are the component's, not ours. `min` is today, the
// sold-out days come back through `isDateBlocked`, and because `spanBlocked`
// is left off, a range may not *contain* a blocked day — the preview stops at
// the first one. An airline that marked a date full did not mean "unless it
// is in the middle of your trip".
import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';

import { Button, Select, byDay } from 'react-x11';
import {
  CALENDAR_WIDTH,
  Calendar,
  DatePicker,
  addDays,
  formatDay,
  toDay,
  today,
} from '@react-x11/components/calendar';
import type { CalendarDay, DateRange } from '@react-x11/components/calendar';
import type { DesktopEvent } from 'react-x11';

import { Caption, fill } from './panel.js';

/**
 * The fixture: one evening, in the shape the desktop would have handed us.
 *
 * A `DesktopEvent` and not a convenience type of our own, deliberately —
 * swapping this array for the hook's is then a one-line change with nothing
 * else to adapt.
 */
export const MELBJS: DesktopEvent = {
  uid: 'melbjs-2026-09@example',
  summary: 'MelbJS',
  location: 'Melbourne',
  description: 'Making a Desktop UI Toolkit From Scratch',
  start: new Date('2026-09-09T18:00:00'),
  end: new Date('2026-09-09T20:30:00'),
  allDay: false,
  recurring: false,
  calendar: { uid: 'personal', name: 'Personal', color: '#58a6ff' },
};

/** What the airline has no seats on. A booking's other kind of blocked day. */
const SOLD_OUT = new Set(['2026-09-14', '2026-09-15']);

const AIRPORTS = [
  { value: 'MEL', label: 'Melbourne (MEL)' },
  { value: 'SYD', label: 'Sydney (SYD)' },
  { value: 'BNE', label: 'Brisbane (BNE)' },
  { value: 'AKL', label: 'Auckland (AKL)' },
];

const CABINS = ['Economy', 'Premium', 'Business'];

/** The month the fixture is in, so the demo opens where the event is. */
const MONTH = '2026-09';

const time = (date: Date) =>
  date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

/** Every day from `start` to `end`, inclusive. */
function span(range: DateRange): CalendarDay[] {
  if (!range.start) return [];
  const days: CalendarDay[] = [];
  for (let d = range.start; d <= (range.end ?? range.start); d = addDays(d, 1)) {
    days.push(d);
    if (days.length > 366) break; // a booking, not a sabbatical
  }
  return days;
}

export interface BookingProps {
  /**
   * The user's events. In an application this is
   * `useDesktopCalendarEvents({ from, to }).events`; here it is a fixture, so
   * the slide needs no calendar service on the machine it runs from.
   */
  events?: readonly DesktopEvent[];
  height?: number;
}

export function Booking({
  events = [MELBJS],
  height,
}: BookingProps): ReactElement {
  const [from, setFrom] = useState('MEL');
  const [to, setTo] = useState('SYD');
  const [cabin, setCabin] = useState('Economy');
  // Opens on a trip that flies out on the day of the talk, so the panel
  // below the form is showing its answer before anybody clicks. Drag the
  // range off the 9th and it goes quiet.
  const [range, setRange] = useState<DateRange>({
    start: '2026-09-09',
    end: '2026-09-11',
  });

  // The package's own grouping, over the package's own event type — the two
  // halves of "this is the hook's output, not a lookalike".
  const days = useMemo(() => byDay([...events]), [events]);

  const clashes = useMemo(
    () => span(range).flatMap((day) => days.get(day) ?? []),
    [range, days],
  );

  return (
    <box style={{ gap: 12, ...fill(height) }}>
      <Caption>calendar — a month grid, and the desktop’s own events</Caption>
      <box style={{ flexDirection: 'row', gap: 48, flexGrow: 1, minHeight: 0 }}>
      <box style={{ width: 380, gap: 14 }}>
        <box style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Select
            value={from}
            options={AIRPORTS}
            onChange={(ev) => setFrom(String(ev.value))}
            style={{ flexGrow: 1 }}
          />
          <text style={{ fontSize: 15, color: '$textMuted' }}>→</text>
          <Select
            value={to}
            options={AIRPORTS}
            onChange={(ev) => setTo(String(ev.value))}
            style={{ flexGrow: 1 }}
          />
        </box>

        {/* The same value as the grid beside it: change one and the other
            moves. A range is `{ start, end }` of `'YYYY-MM-DD'` strings in
            both, because a square on a wall calendar is not an instant. */}
        <DatePicker
          mode="range"
          value={range}
          onChange={(ev) => setRange(ev.value)}
          min={today()}
          defaultMonth={MONTH}
          isDateBlocked={(day) => SOLD_OUT.has(day)}
          placeholder="depart — return"
        />

        <Select
          value={cabin}
          options={CABINS}
          onChange={(ev) => setCabin(String(ev.value))}
        />

        <Button primary label={`Search ${from} → ${to}`} />

        <box
          style={{
            marginTop: 6,
            padding: 12,
            gap: 6,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: clashes.length ? '$accent' : '$border',
            backgroundColor: '$surface',
          }}
        >
          {clashes.length === 0 ? (
            <text style={{ fontSize: 13, color: '$textMuted' }}>
              Nothing in your calendar over those dates.
            </text>
          ) : (
            clashes.map((ev) => (
              <box key={ev.uid} style={{ gap: 2 }}>
                <text style={{ fontSize: 14, color: '$text' }}>
                  {`${ev.summary} — ${time(ev.start)}`}
                </text>
                <text style={{ fontSize: 12, color: '$textMuted' }}>
                  {`${formatDay(toDay(ev.start) ?? '', undefined, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })} · ${ev.location ?? ev.calendar.name}`}
                </text>
              </box>
            ))
          )}
        </box>

      </box>

      <box style={{ gap: 14, alignItems: 'flex-start', justifyContent: 'center' }}>
        <Calendar
          mode="range"
          value={range}
          onChange={(ev) => setRange(ev.value)}
          min={today()}
          defaultMonth={MONTH}
          isDateBlocked={(day) => SOLD_OUT.has(day)}
          dayContent={(day, state) =>
            (days.get(day) ?? []).slice(0, 3).map((ev) => (
              <box
                key={ev.uid}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: state.selected
                    ? state.color
                    : (ev.calendar.color ?? '$accent'),
                }}
              />
            ))
          }
          style={{ width: CALENDAR_WIDTH * 1.3 }}
        />
        <box style={{ flexDirection: 'row', gap: 18, alignItems: 'center' }}>
          <box style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>
            <box
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: '$accent',
              }}
            />
            <text style={{ fontSize: 12, color: '$textMuted' }}>
              in your calendar
            </text>
          </box>
          <text style={{ fontSize: 12, color: '$textMuted' }}>
            dimmed — the airline has no seats
          </text>
        </box>
      </box>

      {/* The claim the dots are making, written out — because a dot is only
          interesting once you know nobody signed in to put it there. */}
      <box
        style={{
          width: 320,
          gap: 10,
          padding: 16,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '$border',
          backgroundColor: '$surface',
          alignSelf: 'flex-start',
        }}
      >
        <text style={{ fontSize: 15, fontWeight: 700 }}>
          Where the dots come from
        </text>
        {[
          'useDesktopCalendarEvents({ from, to })',
          '→ the session bus',
          '→ org.gnome.evolution.dataserver',
          '→ Google · Microsoft · CalDAV · local',
        ].map((line) => (
          <text
            key={line}
            style={{ fontSize: 13, fontFamily: 'monospace', color: '$text' }}
          >
            {line}
          </text>
        ))}
        <text style={{ fontSize: 13, color: '$textMuted' }}>
          The desktop signed into those accounts once, on the user’s behalf,
          for every application on the machine.
        </text>
        <text style={{ fontSize: 13, color: '$accent' }}>
          This one asked for nothing: no OAuth screen, no credential, no
          token to store and no token to leak.
        </text>
      </box>
      </box>
    </box>
  );
}

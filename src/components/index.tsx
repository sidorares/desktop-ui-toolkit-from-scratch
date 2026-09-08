// The components a slide may name — `<Markdown>`'s `components` prop, which
// is the whole of MDX's gate: a tag is a component iff its name is a key
// here, and everything else in a slide is the markdown it always was.
//
// This replaces the ```demo fence the deck used before
// `@react-x11/components` learned MDX. The fence worked, but it could only
// take `key: value` strings and it read as a code block in every editor;
// `<Charts height={380} />` is the thing itself.
//
// Module scope, so the map keeps one identity: a new object per render
// re-parses every slide and defeats `<Markdown>`'s per-block cache.
export { Booking } from './booking.js';
export { Charts } from './charts.js';
export { DataViz } from './dataviz.js';
export { Ecosystem } from './ecosystem.js';
export { DevTools } from './devtools.js';
export { Documents } from './documents.js';
export { HotReload } from './hotreload.js';
export { HtmlPlayground } from './htmlplayground.js';
export { Metric } from './metric.js';
export { Placeholder } from './placeholder.js';
export { Scenes } from './scenes.js';
export { SourceCode } from './source-code.js';
export { Stats } from './stats.js';
export { Terminal } from './terminal.js';
export { Timeline } from './timeline.js';
export { Widgets } from './widgets.js';
export { Wire } from './wire.js';

export type { BookingProps } from './booking.js';
export type { ChartsProps } from './charts.js';
export type { EcosystemProps } from './ecosystem.js';
export type { DataVizProps } from './dataviz.js';
export type { DevToolsProps } from './devtools.js';
export type { DocumentsProps } from './documents.js';
export type { HotReloadProps } from './hotreload.js';
export type { HtmlPlaygroundProps } from './htmlplayground.js';
export type { MetricProps } from './metric.js';
export type { PlaceholderProps } from './placeholder.js';
export type { ScenesProps } from './scenes.js';
export type { SourceCodeProps } from './source-code.js';
export type { StatsProps } from './stats.js';
export type { TerminalProps } from './terminal.js';
export type { TimelineProps } from './timeline.js';
export type { WidgetsProps } from './widgets.js';
export type { WireProps } from './wire.js';

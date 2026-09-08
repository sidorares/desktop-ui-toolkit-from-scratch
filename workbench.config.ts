// `bunx @react-x11/workbench dev` — the workshop for the deck's components.
//
// The slides name these through `<Markdown>`'s `components` map, which means
// a broken one shows up as a broken *slide*, mid-talk, with no way to poke
// at it. The workbench is where they get poked at instead: each on its own,
// every variant at once, props editable while it runs.
export default {
  stories: ['stories/**/*.story.tsx'],
};

// An HTML mode for `<CodeEditor>`.
//
// The editor ships JavaScript, JSON, SQL, shell and GLSL, and adapters for
// Lezer, TextMate and highlight.js grammars — but no HTML, and the split-view
// slide is an HTML editor. So it is a `streamLanguage`: a character-level
// tokenizer with a flat state, which is the seam the built-in modes use and
// about sixty lines for a markup language.
//
// This is the shape of gap the talk is about (slide "The loop"): written in
// the app that wanted it, and belonging in `@react-x11/components` the
// moment a second thing needs it — where it can grow the parts a deck does
// not need, like tokenizing CSS inside `<style>` rather than leaving it
// plain.
import {
  streamLanguage,
  StringStream,
} from '@react-x11/components/code-language';
import type { Language } from '@react-x11/components/code-language';

interface HtmlState {
  /** Inside `<tag …` or `</tag …`, as against inside text. */
  tag: '' | 'open' | 'close';
  /** The next token is the tag's name. */
  name: boolean;
  /** The last token was `=`, so the next one is an attribute value. */
  value: boolean;
  /** The quote of an attribute value left open at the end of a line. */
  quote: string;
  /** Inside `<!-- … -->`. */
  comment: boolean;
  /** Inside a `<script>` or `<style>` body, whose text is not markup. */
  raw: string;
  /** The element being opened, until its `>` decides whether it is raw. */
  pending: string;
}

const RAW_ELEMENTS = ['script', 'style'];
const TAG_NAME = /^[A-Za-z][\w:.-]*/;
const ATTRIBUTE = /^[^\s=<>/"']+/;
const RAW_CLOSE = /^<\/\s*(?:script|style)\b/i;

/** `html` for `<CodeEditor language>`. */
export const html: Language = streamLanguage<HtmlState>({
  name: 'html',
  languageData: {
    // No line comment: `<!-- -->` is a block, and the editor's Ctrl+/ only
    // knows the line kind — better nothing than a wrong `//`.
    wordChars: '-:',
    indentAfter: /<[^/!][^>]*>\s*$/,
  },
  startState: () => ({
    tag: '',
    name: false,
    value: false,
    quote: '',
    comment: false,
    raw: '',
    pending: '',
  }),
  token(stream: StringStream, state: HtmlState): string | null {
    if (state.comment) {
      if (stream.match(/^.*?-->/)) state.comment = false;
      else stream.skipToEnd();
      return 'comment';
    }

    // A `<script>` or `<style>` body is text until its own end tag, which
    // is the one place markup rules stop applying.
    if (state.raw) {
      if (stream.match(RAW_CLOSE, false)) state.raw = '';
      else {
        if (!stream.match(/^[^<]+/)) stream.next();
        return null;
      }
    }

    if (state.tag) {
      // An attribute value that ran off the end of the last line.
      if (state.quote) {
        if (stream.match(new RegExp(`^[^${state.quote}]*${state.quote}`))) {
          state.quote = '';
        } else stream.skipToEnd();
        return 'string';
      }
      if (stream.eatSpace()) return null;
      if (state.name) {
        state.name = false;
        if (stream.match(TAG_NAME)) {
          const name = stream.current().toLowerCase();
          if (state.tag === 'open' && RAW_ELEMENTS.includes(name)) {
            state.pending = name;
          }
          return 'typeName';
        }
      }
      if (stream.match(/^\/?>/)) {
        state.raw = state.pending;
        state.pending = '';
        state.tag = '';
        state.value = false;
        return 'bracket';
      }
      if (state.value) {
        state.value = false;
        const quote = stream.eat(/["']/);
        if (quote) {
          if (!stream.match(new RegExp(`^[^${quote}]*${quote}`))) {
            state.quote = quote;
            stream.skipToEnd();
          }
          return 'string';
        }
        stream.match(/^[^\s>]+/);
        return 'string';
      }
      if (stream.eat('=')) {
        state.value = true;
        return 'operator';
      }
      if (stream.match(ATTRIBUTE)) return 'propertyName';
      stream.next();
      return null;
    }

    if (stream.match(/^<!--/)) {
      state.comment = true;
      return 'comment';
    }
    // `<!doctype html>`, and anything else declaration-shaped.
    if (stream.match(/^<![^>]*>?/)) return 'meta';
    if (stream.match(/^<\//)) {
      state.tag = 'close';
      state.name = true;
      return 'bracket';
    }
    if (stream.eat('<')) {
      state.tag = 'open';
      state.name = true;
      state.pending = '';
      return 'bracket';
    }
    if (stream.match(/^&[#\w]+;?/)) return 'escape';
    if (!stream.match(/^[^<&]+/)) stream.next();
    return null;
  },
});

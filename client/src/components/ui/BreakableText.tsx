import { Fragment } from 'react';

/** Splits a run-together word before each "." and at lower-to-upper case boundaries (no regex lookbehind, for older Safari). */
function breakPoints(word: string): string[] {
  const pieces: string[] = [];
  let start = 0;
  for (let k = 1; k < word.length; k++) {
    const prev = word[k - 1];
    const ch = word[k];
    if (ch === '.' || (prev >= 'a' && prev <= 'z' && ch >= 'A' && ch <= 'Z')) {
      pieces.push(word.slice(start, k));
      start = k;
    }
  }
  pieces.push(word.slice(start));
  return pieces;
}

/**
 * Renders text with line-break opportunities (<wbr>) inside long run-together words such as domain names
 * ("HossainandMoallema.com" -> "Hossainand|Moallema|.com"), so narrow cards wrap at a sensible point instead of
 * overflowing or breaking mid-word. Only words of 16+ characters are touched; ordinary text renders unchanged.
 */
export function BreakableText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((word, i) =>
        word.length < 16 ? (
          <Fragment key={i}>{word}</Fragment>
        ) : (
          <Fragment key={i}>
            {breakPoints(word).map((piece, j) => (
              <Fragment key={j}>
                {j > 0 && <wbr />}
                {piece}
              </Fragment>
            ))}
          </Fragment>
        ),
      )}
    </>
  );
}

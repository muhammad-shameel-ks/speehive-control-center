export function wrapSelection(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  wrapper: string,
): { text: string; selectionStart: number; selectionEnd: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  const hasWrapper = selected.startsWith(wrapper) && selected.endsWith(wrapper);
  const unwrapped = hasWrapper
    ? selected.slice(wrapper.length, -wrapper.length)
    : selected;

  if (hasWrapper) {
    return {
      text: before + unwrapped + after,
      selectionStart,
      selectionEnd: selectionEnd - wrapper.length * 2,
    };
  }

  const wrapped = wrapper + unwrapped + wrapper;
  return {
    text: before + wrapped + after,
    selectionStart: selectionStart + wrapper.length,
    selectionEnd: selectionEnd + wrapper.length,
  };
}

export function insertLinePrefix(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
): { text: string; cursorOffset: number } {
  const lines = text.split("\n");
  let charCount = 0;
  let startLine = -1;
  let endLine = -1;

  for (let i = 0; i < lines.length; i++) {
    if (startLine === -1 && charCount + lines[i].length >= selectionStart) {
      startLine = i;
    }
    charCount += lines[i].length + 1;
    if (charCount >= selectionEnd) {
      endLine = i;
      break;
    }
  }

  if (startLine === -1) startLine = lines.length - 1;
  if (endLine === -1) endLine = lines.length - 1;

  const modified = lines.map((line, i) => {
    if (i < startLine || i > endLine) return line;
    if (line.startsWith(prefix)) return line.slice(prefix.length);
    return prefix + line;
  });

  return { text: modified.join("\n"), cursorOffset: prefix.length };
}

export const TOOLBAR_ACTIONS = {
  bold: "**",
  italic: "*",
  heading1: "# ",
  heading2: "## ",
  heading3: "### ",
  list: "- ",
  code: "`",
  codeBlock: "```\n",
} as const;

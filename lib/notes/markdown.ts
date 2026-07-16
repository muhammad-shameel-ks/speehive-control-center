const ESCAPES: [RegExp, string][] = [
  [/&/g, "&amp;"],
  [/</g, "&lt;"],
  [/>/g, "&gt;"],
];

function escapeHtml(text: string): string {
  let result = text;
  for (const [re, rep] of ESCAPES) {
    result = result.replace(re, rep);
  }
  return result;
}

function inlineFormat(text: string): string {
  let result = escapeHtml(text);
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(/`(.+?)`/g, '<code class="bg-muted px-1 rounded text-[11px]">$1</code>');
  result = result.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" class="text-primary underline" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return result;
}

export function renderMarkdown(text: string): string {
  const lines = text.split("\n");
  let html = "";
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html += `<pre class="bg-muted rounded p-3 text-[11px] font-mono overflow-x-auto my-2"><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`;
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith("### ")) {
      html += `<h3 class="text-[13px] font-semibold text-foreground mt-3 mb-1">${inlineFormat(line.slice(4))}</h3>`;
    } else if (line.startsWith("## ")) {
      html += `<h2 class="text-[14px] font-bold text-foreground mt-3 mb-1">${inlineFormat(line.slice(3))}</h2>`;
    } else if (line.startsWith("# ")) {
      html += `<h1 class="text-[16px] font-bold text-foreground mt-4 mb-1">${inlineFormat(line.slice(2))}</h1>`;
    } else if (line.startsWith("- ")) {
      html += `<li class="text-[12px] text-foreground leading-relaxed ml-3">${inlineFormat(line.slice(2))}</li>`;
    } else if (line.startsWith("1. ")) {
      html += `<li class="text-[12px] text-foreground leading-relaxed ml-3 list-decimal">${inlineFormat(line.slice(3))}</li>`;
    } else if (line.startsWith("> ")) {
      html += `<blockquote class="border-l-2 border-primary pl-3 text-[12px] text-muted-foreground italic my-1">${inlineFormat(line.slice(2))}</blockquote>`;
    } else if (line.startsWith("---")) {
      html += `<hr class="border-border my-3" />`;
    } else if (line.trim() === "") {
      html += "<br />";
    } else {
      html += `<p class="text-[12px] text-foreground leading-relaxed mb-1">${inlineFormat(line)}</p>`;
    }
  }

  if (inCodeBlock && codeBuffer.length > 0) {
    html += `<pre class="bg-muted rounded p-3 text-[11px] font-mono overflow-x-auto my-2"><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`;
  }

  return html;
}

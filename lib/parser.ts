function decodeHtml(str: string): string {
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export interface ParsedEmail {
  id: string;
  sender: string;
  subject: string;
  date: string;
  preview: string;
  isUnread: boolean;
  raw: string;
  url?: string;
  html?: string;
}

export interface ChatMessage {
  sender: string;
  text: string;
  time: string;
  isSent: boolean;
}

export interface ParsedChat {
  id: string;
  title: string;
  date: string;
  lastMessage: string;
  sender: string;
  raw: string;
  url?: string;
  messages?: ChatMessage[];
}

export interface ParsedEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  raw: string;
}

export function parseEmails(text: string | null): ParsedEmail[] {
  if (!text || text.trim() === "") return [];

  // 1. Try parsing MS365 style (split by ---)
  if (text.includes("---")) {
    const segments = text.split(/\n+---\n+/);
    const parsed: ParsedEmail[] = [];
    
    segments.forEach((seg, idx) => {
      const cleanSeg = seg.trim();
      if (!cleanSeg) return;

      // Extract subject from line starting with ###
      const subjectMatch = cleanSeg.match(/^###\s*(?:\*\*NEW\*\*\s*)?(.*)$/m);
      const subject = subjectMatch ? subjectMatch[1].trim() : "No Subject";
      const isUnread = cleanSeg.includes("**NEW**");

      // Extract from and date
      const fromMatch = cleanSeg.match(/\*\*From:\*\*\s*(.*?)·\s*(.*)$/m);
      const sender = fromMatch ? fromMatch[1].trim() : "Unknown Sender";
      const date = fromMatch ? fromMatch[2].trim() : "";

      // Extract body preview (lines after **From:**)
      const lines = cleanSeg.split("\n");
      const fromLineIdx = lines.findIndex(l => l.includes("**From:**"));
      const bodyLines = fromLineIdx !== -1 ? lines.slice(fromLineIdx + 1) : lines;

      const linkMatch = bodyLines.find(l => l.startsWith("**Link:**"))?.match(/\*\*Link:\*\*\s*(https?:\/\/\S+)/);
      const url = linkMatch?.[1];
      const htmlMatch = bodyLines.find(l => l.startsWith("**HTML:**"))?.match(/\*\*HTML:\*\*\s*(\S+)/);
      let html: string | undefined;
      if (htmlMatch?.[1]) {
        try { html = atob(htmlMatch[1]); } catch { html = undefined; }
      }
      const bodyText = bodyLines
        .filter(l => !l.startsWith("**Link:**") && !l.startsWith("**HTML:**"))
        .join("\n").trim();

      const fullBody = decodeHtml(bodyText);
      parsed.push({
        id: `ms365-mail-${idx}`,
        sender: decodeHtml(sender),
        subject: decodeHtml(subject),
        date,
        preview: fullBody.slice(0, 150),
        isUnread,
        raw: fullBody,
        url,
        html,
      });
    });

    if (parsed.length > 0) return parsed;
  }

  // 2. Try parsing Google Workspace/Generic Markdown style (bulleted list)
  const listItems = text.split(/\n\s*[-*+]\s+/);
  if (listItems.length > 1) {
    const parsed: ParsedEmail[] = [];
    listItems.forEach((item, idx) => {
      const cleanItem = item.trim();
      if (!cleanItem || idx === 0) return; // skip header or empty first split

      // Extract Sender/Subject/Snippet using standard regex
      const fromMatch = cleanItem.match(/(?:From|Sender|Author):\s*\*\*?(.*?)\*\*?/i) || cleanItem.match(/\*\*From:\*\*\s*(.*)/i);
      const subjectMatch = cleanItem.match(/(?:Subject|Title):\s*\*\*?(.*?)\*\*?/i) || cleanItem.match(/\*\*Subject:\*\*\s*(.*)/i);
      const dateMatch = cleanItem.match(/(?:Date|Time|Received):\s*\*\*?(.*?)\*\*?/i);
      
      const sender = fromMatch ? fromMatch[1].trim() : "Unknown Sender";
      const subject = subjectMatch ? subjectMatch[1].trim() : "Inbox Message";
      const date = dateMatch ? dateMatch[1].trim() : "";
      
      // Clean up body preview by removing subject/from lines
      let preview = cleanItem
        .replace(/(?:From|Sender|Author|Subject|Title|Date|Time|Received):.*/gi, "")
        .replace(/\*\*.*?\*\*/g, "")
        .trim();

      if (!preview) preview = cleanItem.slice(0, 100);

      parsed.push({
        id: `google-mail-${idx}`,
        sender,
        subject,
        date,
        preview: preview.slice(0, 150),
        isUnread: false,
        raw: cleanItem.trim()
      });
    });

    if (parsed.length > 0) return parsed;
  }

  // 3. Fallback: Parse paragraphs or double newlines
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((para, idx) => {
    const cleanPara = para.trim();
    return {
      id: `fallback-mail-${idx}`,
      sender: "System Feed",
      subject: cleanPara.slice(0, 40) + (cleanPara.length > 40 ? "..." : ""),
      date: "",
      preview: cleanPara.slice(0, 150),
      isUnread: false,
      raw: cleanPara
    };
  });
}

export function parseChats(text: string | null): ParsedChat[] {
  if (!text || text.trim() === "") return [];

  // 1. Try parsing MS365 style (split by ---)
  if (text.includes("---")) {
    const segments = text.split(/\n+---\n+/);
    const parsed: ParsedChat[] = [];

    segments.forEach((seg, idx) => {
      const cleanSeg = seg.trim();
      if (!cleanSeg) return;

      // Header matches: ### Topic · Date
      const headerMatch = cleanSeg.match(/^###\s*(.*?)·\s*(.*)$/m);
      const title = headerMatch ? headerMatch[1].trim() : "Direct Message";
      const date = headerMatch ? headerMatch[2].trim() : "";

      // Extract messages and metadata
      const allContentLines = cleanSeg.split("\n").slice(1);
      const linkMatch = allContentLines.find(l => l.startsWith("**Link:**"))?.match(/\*\*Link:\*\*\s*(https?:\/\/\S+)/);
      const url = linkMatch?.[1];

      // Parse BUBBLE|SENT|RECV|SenderName|HH:MM AM|text lines
      const msgLines = allContentLines.filter(l => l.startsWith("BUBBLE|"));
      const messages: ChatMessage[] = msgLines.map(l => {
        const parts = l.split("|");
        // BUBBLE | SENT|RECV | sender | time | text (text may contain pipes)
        if (parts.length < 5) return null;
        const [, tag, sender, time, ...rest] = parts;
        return { isSent: tag === "SENT", sender: decodeHtml(sender), time, text: decodeHtml(rest.join("|")) };
      }).filter((x): x is ChatMessage => x !== null);

      const lastMsg = messages[messages.length - 1];
      const sender = lastMsg?.sender ?? "";
      const lastMessage = lastMsg?.text ?? "";

      parsed.push({
        id: `ms365-chat-${idx}`,
        title: decodeHtml(title),
        date,
        sender: decodeHtml(sender),
        lastMessage: decodeHtml(lastMessage),
        raw: decodeHtml(lastMessage),
        messages: messages.length > 0 ? messages : undefined,
        url,
      });
    });

    if (parsed.length > 0) return parsed;
  }

  // 2. Try parsing Google/Generic style (bulleted list of messages)
  const listItems = text.split(/\n\s*[-*+]\s+/);
  if (listItems.length > 1) {
    const parsed: ParsedChat[] = [];
    listItems.forEach((item, idx) => {
      const cleanItem = item.trim();
      if (!cleanItem || idx === 0) return; // skip header or empty first split

      // Extract sender/channel/date
      const senderMatch = cleanItem.match(/(?:From|Sender|User):\s*\*\*?(.*?)\*\*?/i) || cleanItem.match(/\*\*?(.*?)\*\*?:/i);
      const channelMatch = cleanItem.match(/(?:Channel|Room|Chat):\s*\*\*?(.*?)\*\*?/i);
      const dateMatch = cleanItem.match(/(?:Date|Time):\s*\*\*?(.*?)\*\*?/i);

      const sender = senderMatch ? senderMatch[1].trim() : "User";
      const title = channelMatch ? channelMatch[1].trim() : `Chat Room ${idx}`;
      const date = dateMatch ? dateMatch[1].trim() : "";
      
      let lastMessage = cleanItem
        .replace(/(?:From|Sender|User|Channel|Room|Chat|Date|Time):.*/gi, "")
        .trim();

      if (!lastMessage) lastMessage = cleanItem.slice(0, 100);

      parsed.push({
        id: `google-chat-${idx}`,
        title: decodeHtml(title),
        date,
        sender: decodeHtml(sender),
        lastMessage: decodeHtml(lastMessage),
        raw: decodeHtml(cleanItem)
      });
    });

    if (parsed.length > 0) return parsed;
  }

  // Fallback
  return [{
    id: "fallback-chat-1",
    title: "Activity Stream",
    date: "",
    sender: "System",
    lastMessage: text.slice(0, 150),
    raw: text
  }];
}

export function parseEvents(text: string | null): ParsedEvent[] {
  if (!text || text.trim() === "") return [];

  // Parse list of events from Google Calendar markdown
  const listItems = text.split(/\n\s*[-*+]\s+/);
  const parsed: ParsedEvent[] = [];

  listItems.forEach((item, idx) => {
    const cleanItem = item.trim();
    if (!cleanItem || idx === 0) return; // skip header

    // Match Event Title, Date, Time
    const titleMatch = cleanItem.match(/(?:Event|Summary|Title):\s*\*\*?(.*?)\*\*?/i) || cleanItem.match(/^\*\*?(.*?)\*\*?/);
    const dateMatch = cleanItem.match(/(?:Date|When):\s*\*\*?(.*?)\*\*?/i);
    const timeMatch = cleanItem.match(/(?:Time):\s*\*\*?(.*?)\*\*?/i);

    const title = titleMatch ? titleMatch[1].trim() : cleanItem.slice(0, 40);
    const date = dateMatch ? dateMatch[1].trim() : "";
    const time = timeMatch ? timeMatch[1].trim() : "";

    parsed.push({
      id: `event-${idx}`,
      title,
      date,
      time,
      raw: cleanItem
    });
  });

  if (parsed.length > 0) return parsed;

  // Fallback: split by lines
  const lines = text.split("\n");
  lines.forEach((line, idx) => {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith("#") || cleanLine.length < 5) return;
    parsed.push({
      id: `line-event-${idx}`,
      title: cleanLine,
      date: "",
      time: "",
      raw: cleanLine
    });
  });

  return parsed;
}

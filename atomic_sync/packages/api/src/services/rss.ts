import Parser from "rss-parser";

const parser = new Parser({
  timeout: 15_000,
  headers: {
    "User-Agent": "AtomicSync/0.1",
  },
});

export interface FeedItem {
  guid: string;
  title: string;
  link: string | undefined;
  content: string;
  pubDate: string | undefined;
}

export interface ParsedFeed {
  title: string | undefined;
  items: FeedItem[];
}

export async function fetchFeed(url: string): Promise<ParsedFeed> {
  const feed = await parser.parseURL(url);

  const items: FeedItem[] = feed.items.map((item) => ({
    guid: item.guid || item.link || item.title || "",
    title: item.title || "Untitled",
    link: item.link,
    content: item.contentSnippet || item.content || "",
    pubDate: item.pubDate || item.isoDate,
  }));

  return {
    title: feed.title,
    items,
  };
}

// Format an RSS item as markdown for creating an atom
export function formatItemAsMarkdown(item: FeedItem): string {
  const lines: string[] = [];

  lines.push(`# ${item.title}`);
  lines.push("");

  if (item.pubDate) {
    lines.push(`*${item.pubDate}*`);
    lines.push("");
  }

  if (item.content) {
    lines.push(item.content);
  }

  return lines.join("\n");
}

export const DURATION_OPTIONS = [
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
];

export const DEFAULT_DURATION_MINUTES = 120;

export function applySlotUpdates(bucket, updates) {
  const allowed = new Set(["green", "yellow", "red"]);
  for (const [slotId, status] of Object.entries(updates || {})) {
    if (!allowed.has(status)) continue;
    if (status === "green") delete bucket[slotId];
    else bucket[slotId] = status;
  }
}

export function isValidDuration(minutes) {
  return DURATION_OPTIONS.some((d) => d.value === minutes);
}

export function isManager(event, name) {
  if (!event?.managerName || !name) return false;
  return event.managerName.toLowerCase() === String(name).toLowerCase();
}

export const MATERIAL_KINDS = [
  { value: "paper", label: "Paper" },
  { value: "topic", label: "Topic" },
  { value: "link", label: "Link" },
  { value: "file", label: "File" },
];

export const MAX_MATERIALS = 40;
export const MAX_MATERIAL_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_MATERIAL_TOTAL_BYTES = 20 * 1024 * 1024;

export function normalizeMaterialUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  const doi = value.match(/^(?:doi:\s*)?(10\.\d{4,}\/\S+)/i);
  if (doi) return `https://doi.org/${doi[1]}`;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[\w.-]+\.[a-z]{2,}([/?#].*)?$/i.test(value)) return `https://${value}`;
  return "";
}

function materialsBlock(event, shareUrl) {
  const items = event.materials || [];
  if (!items.length) return "";
  const origin = String(shareUrl || "").replace(/\/m\/[^/]+\/?$/, "");
  const lines = items.map((item) => {
    const href = item.url?.startsWith("/") ? `${origin}${item.url}` : item.url;
    return `- ${item.title}${href ? ` — ${href}` : ""}`;
  });
  return `\nPapers & topics:\n${lines.join("\n")}\n`;
}

export function emailDraft(event, shareUrl, emails, kind) {
  const when = event.pinnedLabel || "";
  const extras = materialsBlock(event, shareUrl);
  const subject = kind === "pinned" && when
    ? `${event.name} — proposed time: ${when}`
    : `${event.name} — pick a meeting time`;
  const body = kind === "pinned" && when
    ? `Hi,\n\nThe proposed time for "${event.name}" is:\n${when}\nTimezone: ${event.timezone}\n${extras}\nEvent page:\n${shareUrl}\n`
    : `Hi,\n\nPlease mark when you can meet for "${event.name}".\nGreen = available, yellow = if needed, red = cannot.\n${extras}\n${shareUrl}\n`;
  const bcc = emails.filter(Boolean).join(",");
  const mailto = `mailto:?${bcc ? `bcc=${encodeURIComponent(bcc)}&` : ""}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { subject, body, mailto, count: emails.filter(Boolean).length };
}

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

export function emailDraft(event, shareUrl, emails, kind) {
  const when = event.pinnedLabel || "";
  const subject = kind === "pinned" && when
    ? `${event.name} — proposed time: ${when}`
    : `${event.name} — pick a meeting time`;
  const body = kind === "pinned" && when
    ? `Hi,\n\nThe proposed time for "${event.name}" is:\n${when}\nTimezone: ${event.timezone}\n\nEvent page:\n${shareUrl}\n`
    : `Hi,\n\nPlease mark when you can meet for "${event.name}".\nGreen = available, yellow = if needed, red = cannot.\n\n${shareUrl}\n`;
  const bcc = emails.filter(Boolean).join(",");
  const mailto = `mailto:?${bcc ? `bcc=${encodeURIComponent(bcc)}&` : ""}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { subject, body, mailto, count: emails.filter(Boolean).length };
}

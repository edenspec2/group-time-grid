import { useState } from "react";
import { MATERIAL_KINDS, MAX_MATERIAL_FILE_BYTES } from "../lib/event.js";

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      const data = raw.includes(",") ? raw.split(",")[1] : raw;
      resolve({ filename: file.name, mime: file.type, data });
    };
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });
}

function kindLabel(kind) {
  return MATERIAL_KINDS.find((k) => k.value === kind)?.label || "Link";
}

export default function Materials({ eventId, materials, me, manager, onEvent, onError }) {
  const [kind, setKind] = useState("paper");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);

  async function post(body) {
    const res = await fetch(`/api/events/${eventId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        name: me.name,
        password: me.password || "",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not update materials");
    onEvent(data);
  }

  async function add(e) {
    e.preventDefault();
    if (!me) return;
    onError("");
    if (file && file.size > MAX_MATERIAL_FILE_BYTES) {
      onError("Files must be 4 MB or smaller. Use a Drive / Dropbox / PDF link instead.");
      return;
    }
    setBusy(true);
    try {
      await post({
        action: "add",
        kind,
        title,
        url,
        note,
        file: file ? await readFile(file) : null,
      });
      setTitle("");
      setUrl("");
      setNote("");
      setFile(null);
      setFileKey((n) => n + 1);
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(materialId) {
    if (!me) return;
    onError("");
    try {
      await post({ action: "remove", materialId });
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <section className="panel materials">
      <h2>Papers & topics</h2>
      <p className="help">
        Pin a paper, a discussion topic, or a file so everyone has the reading in one place.
        Links work best (DOI, PDF, Drive, Notion). Uploaded files stay on this meeting.
      </p>
      {materials.length === 0 ? (
        <p className="help">Nothing pinned yet.</p>
      ) : (
        <ul className="material-list">
          {materials.map((item) => (
            <li key={item.id}>
              <div>
                <span className={`chip chip-${item.kind}`}>{kindLabel(item.kind)}</span>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
                ) : (
                  <strong>{item.title}</strong>
                )}
                {item.note ? <p className="material-note">{item.note}</p> : null}
                <p className="meta">
                  Added by {item.addedBy}
                  {item.filename ? ` · ${item.filename}` : ""}
                </p>
              </div>
              {me && (manager || me.name === item.addedBy) ? (
                <button className="linkish" type="button" onClick={() => remove(item.id)}>Remove</button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {me ? (
        <form className="material-form" onSubmit={add}>
          <div className="material-row">
            <label className="field">
              <span>Type</span>
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                {MATERIAL_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>{k.label}</option>
                ))}
              </select>
            </label>
            <label className="field grow">
              <span>{kind === "paper" ? "Title / citation" : kind === "topic" ? "Topic" : "Title"}</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={kind === "paper" ? "Author, year — short title" : "What should people look at?"}
                required
              />
            </label>
          </div>
          <label className="field">
            <span>
              {kind === "paper" ? "DOI or link" : "Link"}
              {kind === "topic" ? " (optional)" : kind === "file" ? " (optional if you upload a file)" : ""}
            </span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={kind === "paper" ? "10.1021/… or https://…" : "https://…"}
            />
          </label>
          <label className="field">
            <span>Or upload a file (PDF, Word, slides, image — 4 MB max)</span>
            <input
              key={fileKey}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
            />
          </label>
          <label className="field">
            <span>Note (optional)</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why this is on the agenda"
            />
          </label>
          <div className="ready">
            <button className="primary" type="submit" disabled={busy || !title.trim()}>
              Pin to meeting
            </button>
          </div>
        </form>
      ) : (
        <p className="help">Sign in to pin a paper, topic, file, or link.</p>
      )}
    </section>
  );
}

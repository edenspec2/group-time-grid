# Group Time Grid

A When2meet-style scheduler: one link, everyone paints 30-minute boxes, and the group calendar shows **how many people picked the same time**.

- **Green** available (default)
- **Yellow** possible but not great
- **Red** cannot
- Click a status, then click a box (no drag)
- One **manager** can pin a 2/3/4-hour time and email the group
- Live updates for everyone on the same event link
- Each group cell shows `N of total` people available, plus names on hover

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Create an event, copy the link, and open it in another browser (or incognito) to see live overlap counts.

To share on your network after building:

```bash
npm run build
npm start
```

Then open `http://YOUR-LAN-IP:3001`.

## How to use

1. Name the event, drag-select dates (defaults to the next two weeks), set the hour window and timezone.
2. Share the `/m/...` URL.
3. Each person signs in with a display name. Optional password stops others from overwriting that name.
4. Select Available / If needed / Cannot, then **click** a 30-minute box. The grid starts available (green). Come back later and sign in with the same name to edit.
5. The event creator is the **manager**. They can pin a 2/3/4-hour block and email the group (opens the manager’s mail app; people should enter an email when signing in).
6. Read **Group's Availability**: the number in a box is how many people marked it available. Darker green is better overlap.

No accounts. Event data is stored in `data/events.json` on the machine running the server.

## Deploy

This is a single Node process: build the frontend, then serve API, WebSocket, and static files together.

```bash
npm ci
npm run build
npm start
```

On Render / Railway / Fly, set `NODE_ENV=production` and start with `npm start`. The service must allow WebSockets.

For durable no-cost storage on Render, create a Supabase project and set:

- `SUPABASE_URL` to the project URL
- `SUPABASE_SERVICE_ROLE_KEY` to the server-only service-role key
- `SUPABASE_BUCKET` to `group-time-grid` (optional; this is the default)

The server creates a private Storage bucket automatically and stores both `events.json` and uploaded files there. Never expose the service-role key to the browser. Without these variables, local `data/` storage remains available for development but is ephemeral on free Render services.

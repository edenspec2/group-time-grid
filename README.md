# Group Time Grid

A When2meet-style scheduler: one link, everyone paints 15-minute boxes, and the group calendar shows **how many people picked the same time**.

- **Green** available
- **Yellow** possible but not great
- **Red** cannot (the grid starts red after you sign in)
- Live updates for everyone on the same event link
- Each group cell shows `N of total` people available, plus names on hover
- Top 3 suggested blocks for the chosen meeting length

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

1. Name the event, drag-select dates (or weekdays), set the hour window and timezone.
2. Share the `/m/...` URL.
3. Each person signs in with a display name. Optional password stops others from overwriting that name.
4. Drag green/yellow/red on **Your Availability**.
5. Read **Group's Availability**: the number in a box is how many people marked it available. Darker green is better overlap.
6. Pin a suggested time and copy it or download an `.ics`.

No accounts. Event data is stored in `data/events.json` on the machine running the server.

## Deploy

This is a single Node process: build the frontend, then serve API, WebSocket, and static files together.

```bash
npm ci
npm run build
npm start
```

On Render / Railway / Fly, set `NODE_ENV=production` and start with `npm start`. The service must allow WebSockets. Free hosts may wipe `data/events.json` on restart.

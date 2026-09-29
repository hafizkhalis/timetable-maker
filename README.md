# Timetable Maker

Turn your weekly class schedule into a calm little wallpaper for your phone, tablet or desktop.
Free, private, and runs entirely in your browser: no account, no server, nothing uploaded.

## How to use it

1. **Classes**: add your subjects and time slots. UiTM students can type their student ID under
   *Import from UiTM* to fetch everything automatically.
2. **Schedule**: drag each class from *Your Classes* onto the day and time it happens.
   Drag a placed class to move it, pull its right edge to make it longer, or drop it on the red bar
   to remove it. On a touch screen, press and hold first. Tap a cell to edit room and lecturer.
3. **Style**: pick a gradient theme or **upload your own photo** as the background (move, zoom, darken,
   blur and frost it so the text stays readable), and place the timetable at the
   top, below the lock-screen clock, middle or bottom. Each device size remembers its own position.
4. **Save**: download the PNG and set it as your wallpaper. Save a small `.json` file as a backup;
   load it later (or drop it anywhere on the page) to pick up where you left off.

Use the **Help** button in the app for a quick guide, and the sun/moon button to switch between light and dark.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Your data

- Work is autosaved in your browser (`localStorage`). Clearing site data or using another
  browser starts fresh, so use **Save Timetable File** for backups.
- Your background photo is shrunk and kept on your device only (its own `localStorage` entry, and inside
  a saved timetable file if you save one). It is never uploaded.
- The only network request the app makes is the optional UiTM import
  (`https://cdn.uitm.link/jadual/baru/<student id>.json`). Fonts and the PNG library load from public CDNs.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, welcome card, help |
| `style.css` | Light/dark editor theme and the wallpaper look |
| `app.js` | UI, drag and drop, export, storage |
| `model.js` | Pure schedule logic: validation, file format, UiTM conversion |

### Saved file format (v2)

```json
{
  "app": "timetable-maker", "version": 2,
  "meta": { "groupName": "...", "semester": "...", "footerText": "..." },
  "appearance": { "theme": 0, "exportFormat": "iphone", "layout": { "iphone": { "v": "top", "offset": 280 } },
                  "background": { "mode": "photo", "dim": 25, "blur": 0, "frost": 18, "image": "data:image/jpeg;base64,..." } },
  "timeSlots": ["08:00 AM", "10:30 AM"],
  "activeDays": ["sun", "mon"],
  "subjects": [{ "code": "CSC510", "fullName": "", "color": "#8b5cf6", "textColor": "#ede9fe" }],
  "schedule": [{ "day": "sun", "slotIndex": 0, "span": 1, "subject": "CSC510", "type": "Lecture", "room": "MK C3", "lecturer": "" }]
}
```

Older files are still accepted.

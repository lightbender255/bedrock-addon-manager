# Development Guide - Hot Reload & Code Changes

## Making Code Changes While App is Running

### ✅ What Can Be Changed with Hot Reload:

**Renderer Process Files (Auto-refresh on file save):**
- `src/renderer.js` - UI logic, event handlers
- `src/index.html` - HTML structure, UI elements  
- `src/styles.css` - CSS styling, layout
- Any files in the renderer process

**How it works:**
1. Run `npm run dev` to start in development mode
2. Make changes to renderer files
3. Save the file - the app automatically refreshes
4. Changes are visible immediately

### ❌ What Requires Full Restart:

**Main Process Files:**
- `src/main.js` - IPC handlers, window creation, settings
- `src/preload.js` - Security bridge between main and renderer
- `package.json` - Dependencies, scripts

**For these changes:**
1. Stop the app (Ctrl+C in terminal)
2. Restart with `npm run dev`

## Development Commands

```bash
# Normal mode (no hot reload)
npm start

# Development mode (with hot reload)
npm run dev

# Build distributable
npm run dist

# Run tests
npm test
```

## Development Workflow

### For UI/Styling Changes:
1. `npm run dev`
2. Edit `renderer.js`, `index.html`, or `styles.css`
3. Save - see changes immediately

### For Backend/IPC Changes:
1. Edit `main.js` or `preload.js`
2. Stop app (Ctrl+C)
3. `npm run dev` to restart

### Example: Adding a New UI Feature
1. Add HTML elements in `index.html`
2. Add styling in `styles.css`  
3. Add event handlers in `renderer.js`
4. All changes visible immediately with auto-refresh

### Example: Adding New Settings
1. Add IPC handler in `main.js` (requires restart)
2. Add API method in `preload.js` (requires restart)
3. Add UI logic in `renderer.js` (auto-refresh)

## Tips

- Keep the dev terminal visible to see logs and errors
- Use browser dev tools: Ctrl+Shift+I in the Electron window
- Console.log and window.electronAPI.log both work for debugging
- Settings persist between restarts during development
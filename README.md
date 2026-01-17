# LinkSpace

A browser extension for organizing and managing links using workspaces and modes.

## Features

- **Workspaces**: Organize links into separate workspaces with custom icons
- **Modes**: Create different views of your links for different contexts
- **Folders**: Nest links in folders for better organization
- **Drag and Drop**: Easily reorganize links and folders
- **Keyboard Navigation**: Navigate and manage links with keyboard shortcuts
- **Icon Picker**: Customize workspace icons from a palette
- **Quick Add**: Quickly add links to a default workspace

## Installation

### Development

1. Clone the repository:
```bash
git clone <repository-url>
cd linkspace
```

2. Install dependencies:
```bash
bun install
```

3. Build the extension:
```bash
bun run build
```

4. Load the extension in Chrome/Edge:
   - Open `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory

### Development Mode

Run the build in watch mode for automatic rebuilding:
```bash
bun run dev
```

## Building

Build the extension for production:
```bash
bun run build
```

Create a zip file for distribution:
```bash
bun run pack
```

## Usage

1. Click the LinkSpace icon in your browser toolbar (or press `Ctrl+Shift+L` / `Cmd+Shift+L` on Mac)
2. Create a workspace to start organizing your links
3. Add links by clicking the add button or using the quick add feature
4. Organize links into folders by dragging and dropping
5. Create modes to view different subsets of your links
6. Use keyboard shortcuts for faster navigation

## Keyboard Shortcuts

- `Ctrl+Shift+L` (Windows/Linux) or `Cmd+Shift+L` (Mac): Open LinkSpace

## Tech Stack

- **React 19**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Bun**: Runtime and build tool
- **Chrome Extension APIs**: Storage, tabs, context menus, tab groups

## Project Structure

```
linkspace/
├── src/
│   ├── background/     # Service worker scripts
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── popup/          # Popup UI entry point
│   ├── styles/         # Global styles
│   └── types/          # TypeScript type definitions
├── public/             # Static assets (manifest, icons, HTML)
├── dist/               # Build output
└── config/             # Build configuration
```

## Development

### Code Formatting

Format code:
```bash
bun run format
```

Lint code:
```bash
bun run lint
```

## Permissions

The extension requires the following permissions:
- `storage`: Save your workspaces and links
- `tabs`: Access tab information
- `contextMenus`: Add context menu options
- `tabGroups`: Organize tabs into groups
- `notifications`: Show notifications

# LLMs READ AGENTS.md BEFORE EXECUTING/READING THIS FILE

# 1. Proposed Base Features
- [x] **Settings Page**: Add a settings page to the application where users can customize their experience. For now only a base page since currently there's nothing to customize but in the future this page can be expanded with various settings and preferences for the users to adjust according to their needs and preferences.
    - [x] Create `Settings.tsx` component in `frontend/src/components`.
    - [x] Add navigation to Settings in `Sidebar.tsx`.
    - [x] Update `App.tsx` to handle Settings page state and rendering.
    - [x] Add basic settings like "General" section with existing auto-save and sync-scroll toggles (redundant but good for centralizing).
- [x] **Discord Rich Presence**: Integrate Discord Rich Presence to allow users to display their current activity within the application on their Discord profile. This feature will enhance user engagement and provide a way for users to share their experience with friends on Discord. Integrate it to the settings page.
    - [x] Add `DiscordRPC` field to `Settings` struct in `settings.go`.
    - [x] Implement Discord RPC logic in a new file (e.g., `discord.go`).
    - [x] Initialize Discord RPC in `app.go` startup.
    - [x] Update Discord RPC status when a file is opened or renamed.
    - [x] Add a toggle for Discord RPC in the Settings page.
- [x] **Sidebar Resize**: Implement a feature that allows users to resize the sidebar for better usability and customization. This will enhance the user experience by allowing them to adjust the layout according to their preferences. Mainly because after a number of subfolder it becomes hard to navigate the sidebar and this will allow users to adjust the width of the sidebar to better fit their needs.
    - [x] Add `sidebarWidth` state and resizing logic in `App.tsx`.
    - [x] Add a vertical resize handle in `Sidebar.tsx`.
    - [x] Pass `sidebarWidth` to `Sidebar` and use it for styling.
    - [x] Update `Settings` component to allow resetting sidebar width.
    - [x] Ensure sidebar width is persisted in settings.
- [x] **Custom Context Menu**: Implement a custom context menu that appears when users right-click within the application. This menu will provide quick access to common actions such as creating new files, renaming files, deleting files, and other relevant options based on the context of the click (e.g., file vs. folder).
    - [x] Create a `ContextMenu` component in `frontend/src/components`.
    - [x] Implement logic to show the context menu on right-click events in relevant components (e.g., file list, editor).
    - [x] Populate the context menu with appropriate options based on the context (file vs. folder vs. menubar vs. sidebar).
    - [x] Implement handlers for each context menu action (e.g., create, rename, delete).
    - [x] Ensure the context menu is styled appropriately and is responsive.

# 2. Rename Project to Archivum.md
- [x] **Rename Project and Settings**: Rename the application to "Archivum.md" instead of "Archivum Markdown" across configuration files, source code, metadata, and scripts.
    - [x] Update `wails.json` metadata (name, outputfilename, product, name).
    - [x] Update `main.go` window title to "Archivum.md".
    - [x] Update `discord.go` large presence text to "Archivum.md".
    - [x] Update installer script (`build/windows/installer/project.nsi` and `wails_tools.nsh`).
    - [x] Update CI/CD workflow (`.github/workflows/build.yml`) build step output files and release artifacts.
    - [x] Update frontend app/branding titles (`frontend/src/App.tsx`, `frontend/src/components/Settings.tsx`, and `frontend/index.html`).
    - [x] Update project documentation (`README.md`).

# 3. Improve Performance
- [x] **Performance Optimization**: Optimize the application's performance by implementing techniques such as lazy loading, code splitting, and optimizing rendering. This will ensure that the application runs smoothly and efficiently, providing a better user experience.
    - [x] Implement lazy loading for components that are not immediately needed (e.g., Settings page).
    - [x] Use React's `Suspense` and `lazy` for code splitting.
    - [x] Optimize rendering by using `React.memo` and `useCallback` where appropriate.
    - [x] Profile the application to identify and address any performance bottlenecks.
    - [x] Optimize file handling and rendering for large markdown files. (markdown files are taking too long to load and render, especially with a large number of files in the sidebar)
    - [x] Add a loading indicator when opening large files to improve user experience.
    - [x] Implement virtualized lists for the sidebar to improve performance with a large number of files and folders.

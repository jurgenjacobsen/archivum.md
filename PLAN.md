> LLMs READ AGENTS.md BEFORE EXECUTING/READING THIS FILE

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
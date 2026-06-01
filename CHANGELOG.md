# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-06-01

### Added
- **Settings Page**: Introduced a dedicated Settings page for user customization, including toggles for Auto-save, Sync Scroll, and Integrations.
- **Discord Rich Presence**: Integrated Discord RPC to display current editing activity (current file name and status) on user's Discord profile.
- **Resizable Sidebar**: Users can now resize the sidebar by dragging its right edge. The preferred width is persisted across sessions and can be reset to default in the Settings page.

## [1.0.10] - 2026-05-03

### Added
- **Open with**: Added an "Open with Archivum Markdown" option to the right-click context menu in Windows Explorer, allowing users to quickly open markdown files with the application.

## [1.0.9] - 2026-05-02

### Added
- **Global & Workspace Settings System**: Implemented a dual-layer settings system. Settings are saved globally in the application directory by default. Workspace-specific settings (`archivum-settings.json`) are supported if manually created by the user.
- **Auto-Update System**: Integrated a GitHub-based update checker that notifies users of new releases and provides a direct download link.
- **Automated Multi-OS CI/CD**: Set up GitHub Actions to automatically build and package the application for Windows, macOS, and Linux on every tag push.

### Changed
- **Installer Refinement**: 
    - Optimized Windows installation path to `C:\Program Files\Archivum Markdown` to avoid nested directory repetition.
    - Updated application branding in the installer to "Archivum Markdown" with proper spacing.
    - Standardized executable name to `ArchivumMarkdown.exe`.
- **Versioning Single Source of Truth**: Refactored the backend to embed `wails.json`, ensuring the internal app version and update checker are always synchronized with the project configuration.
- **Workflow Optimization**: Switched to Ubuntu 22.04 for Linux builds to ensure compatibility with `webkit2gtk-4.0`.
- **Metadata Update**: Updated copyright information to 2026 and synchronized versions across `wails.json` and `package.json`.

### Fixed
- Fixed a bug in the sidebar where action buttons were displayed for parent items when hovering over deeply nested children. Hover states are now properly scoped to individual items.
- Fixed a bug where settings were being saved to the workspace folder by default instead of the application directory.
- Fixed Windows runner build failures by properly installing and configuring NSIS (makensis).
- Resolved Linux build failures by ensuring the correct WebKitGTK dependencies and build tags were used.

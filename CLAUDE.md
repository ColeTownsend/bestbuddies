# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build for production
bun build

# Preview production build
bun preview
```

## Architecture Overview

This is an Astro 5.11.0 project with React 19.1.0 integration for interactive components. The project uses:

- **Astro** for static site generation and routing
- **React** for dynamic UI components with Motion library for animations
- **TailwindCSS v4** with custom design tokens defined in `src/styles/global.css`
- **TypeScript** with strict mode enabled
- **Bun** as the package manager

### Key Architectural Patterns

1. **Hybrid Rendering**: Astro handles static pages while React components provide interactivity
2. **Component Organization**: 
   - Astro components for layouts and static content
   - React components in `src/components/react/` for interactive features
3. **Animation-First Design**: Heavy use of Motion library (v12.23.3) with custom hooks for smooth interactions
4. **Design System**: Comprehensive design tokens in `@theme` CSS layer including colors, typography, shadows, and motion timing functions

### Project Structure

- `src/pages/` - Astro page routes
- `src/layouts/` - Layout components (Layout.astro)
- `src/components/` - Mixed Astro and React components
- `src/components/react/` - React-specific components with animations
- `src/styles/global.css` - TailwindCSS configuration and design tokens
- `src/assets/` - Static assets (SVGs)

### Key Components

**LineMinimap** (`src/components/react/source.tsx`): A sophisticated animated component featuring:
- Scroll-based animations with Motion springs
- Mouse proximity detection with distance calculations
- Performance optimizations using RAF and smoothing
- Complex state management for interactive effects

### Custom Hooks Available

- `use-is-hydrated.ts` - Client-side hydration detection
- `use-media-query.ts` - Responsive breakpoint detection
- `use-scroll-end.ts` - Scroll end event handling
- `use-sound.ts` - Audio playback functionality

### CSS Architecture

The project uses TailwindCSS v4 with extensive custom theme configuration:
- Custom font families: "Area Normal" (sans), supply (mono)
- Comprehensive color system with light/dark mode support
- P3 color space support for enhanced colors
- Custom animation timing functions including bounce easing
- Utility classes for common patterns (flex-center, grid-stack, translate-center)

### TypeScript Configuration

- Extends Astro's strict TypeScript config
- React JSX transform enabled
- All source files included except `dist/`

### Documentation
Use context7 to find the most up to date documentation on frameworks and libraries like motion and astro.
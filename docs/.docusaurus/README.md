# Docusaurus Documentation

This directory contains the Docusaurus configuration and documentation source files.

## Running Documentation Locally

```bash
# From project root
yarn docs:dev

# Or from docs directory
cd docs && npm run dev
```

Documentation will be available at http://localhost:3000

## Building Documentation

```bash
# From project root
yarn docs:build

# Or from docs directory
cd docs && npm run build
```

## Project Structure

```
docs/
├── docusaurus.config.js    # Docusaurus configuration
├── sidebars.js             # Navigation sidebar
├── src/
│   └── css/
│       └── custom.css      # Custom styles
├── getting-started/        # Getting started guides
├── core-concepts/          # Core concept docs
├── tutorials/              # Step-by-step tutorials
├── api-reference/          # API documentation
└── advanced/               # Advanced topics
```

## Adding New Pages

1. Create a markdown file in the appropriate directory
2. Add to `sidebars.js` in the appropriate section
3. Restart the dev server to see changes

## Customization

Edit `docusaurus.config.js` for:
- Site title and description
- Navbar configuration
- Footer links
- Theme colors
- Plugins

Edit `sidebars.js` for:
- Navigation structure
- Doc ordering
- Categories


# 📚 Documentation Guide

## Generating Documentation

To generate a single HTML page containing all documentation:

```bash
pnpm docs:generate
```

This will create the file `docs/all-documentation.html` which contains:

- ✅ All 16 documentation documents
- ✅ Interactive navigation with table of contents
- ✅ Mermaid diagram support
- ✅ Syntax highlighting for code
- ✅ Responsive design
- ✅ Search with Ctrl+F

## Viewing Documentation

### Option 1: Open Directly

```bash
# macOS
open docs/all-documentation.html

# Linux
xdg-open docs/all-documentation.html

# Windows
start docs/all-documentation.html
```

### Option 2: Local Server

```bash
# With Python
cd docs && python3 -m http.server 8000

# Then open http://localhost:8000/all-documentation.html

# Or with Node.js
npx serve docs
# Then navigate to all-documentation.html
```

## Documentation Structure

```text
docs/
├── all-documentation.html     # 📄 Generated complete documentation
├── index.html                 # Auto-redirect to all-documentation.html
├── README.md                  # Main index
├── 01-getting-started/        # Introduction and basics
├── 02-architecture/           # Technical architecture
├── 03-development/            # Development guides
├── 04-best-practices/         # Standards and best practices
└── 05-operations/             # Deployment and operations
```

## Features

- **Navigation**: Fixed sidebar with all documents
- **Search**: Use Ctrl+F to search
- **Back to Top**: Floating button to return to top
- **Internal Links**: Navigation between sections
- **Code**: Copy buttons and syntax highlighting
- **Diagrams**: Automatic rendering of Mermaid diagrams
- **Print**: Optimized for printing (Ctrl+P)

## Customization

To modify the style or structure, edit:

- `scripts/generate-docs-html.js`

## Deployment

The generated HTML file can be:

- 📧 Sent by email
- 🌐 Hosted on any web server
- 💾 Used offline
- 🖨️ Printed to PDF via browser

## Updating Documentation

After modifying documentation:

```bash
# Regenerate HTML
pnpm docs:generate
```

The documentation is now ready to be viewed!
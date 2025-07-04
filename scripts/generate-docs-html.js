#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const hljs = require('highlight.js');

// Configure marked with syntax highlighting and custom heading IDs
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false
});

// Custom renderer for heading IDs
const renderer = new marked.Renderer();
const originalHeadingRenderer = renderer.heading;

renderer.heading = function(text, level, raw, slugger) {
  // Get the raw text for ID generation
  let rawText = raw || '';
  
  // If raw is not available, try to extract from text
  if (!rawText) {
    if (typeof text === 'string') {
      rawText = text;
    } else if (typeof text === 'object' && text !== null) {
      if (text.text) {
        rawText = text.text;
      } else if (text.raw) {
        rawText = text.raw;
      }
    }
  }
  
  // Create a clean ID from the raw text
  const escapedText = rawText.toString().toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim();
  
  // Call the original renderer to get the properly formatted HTML
  const html = originalHeadingRenderer.call(this, text, level, raw, slugger);
  
  // Add the ID to the heading tag
  if (html.match(/^<h\d/)) {
    return html.replace(/^<h(\d)/, `<h$1 id="${escapedText}"`);
  }
  
  // Fallback if the HTML doesn't match expected format
  return `<h${level} id="${escapedText}">${html}</h${level}>`;
};

marked.setOptions({ renderer });

// Documentation structure
const docStructure = [
  {
    title: 'Documentation',
    files: [
      'README.md'
    ]
  },
  {
    title: '01 - Getting Started',
    files: [
      '01-getting-started/01-api-documentation.md',
      '01-getting-started/02-development-workflow.md',
      '01-getting-started/03-troubleshooting.md',
      '01-getting-started/04-documentation-guide.md'
    ]
  },
  {
    title: '02 - Architecture',
    files: [
      '02-architecture/01-graphql-federation-guide.md',
      '02-architecture/02-nx-monorepo-guide.md',
      '02-architecture/03-architecture-overview.md'
    ]
  },
  {
    title: '03 - Development',
    files: [
      '03-development/01-adding-new-service.md',
      '03-development/02-adding-new-library.md',
      '03-development/03-codegen-guide.md'
    ]
  },
  {
    title: '04 - Best Practices',
    files: [
      '04-best-practices/01-graphql-best-practices.md',
      '04-best-practices/02-codegen-best-practices.md',
      '04-best-practices/03-security.md'
    ]
  },
  {
    title: '05 - Operations',
    files: [
      '05-operations/01-deployment.md'
    ]
  }
];

// HTML template with dark mode
const htmlTemplate = (title, navigation, content) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - NestJS GraphQL Microservices Documentation</title>
    <link href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.0/github-markdown.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css" rel="stylesheet">
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #c9d1d9;
            background: #0d1117;
        }
        .container {
            display: flex;
            min-height: 100vh;
        }
        .sidebar {
            width: 300px;
            background: #161b22;
            border-right: 1px solid #30363d;
            overflow-y: auto;
            position: fixed;
            height: 100vh;
            padding: 20px;
            padding-bottom: 80px; /* Space for author */
        }
        .sidebar h1 {
            font-size: 18px;
            margin-bottom: 30px;
            color: #f0f6fc;
        }
        .sidebar h2 {
            font-size: 16px;
            font-weight: 600;
            margin: 20px 0 10px 0;
            color: #f0f6fc;
        }
        .sidebar ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .sidebar li {
            margin: 5px 0;
        }
        .sidebar a {
            color: #58a6ff;
            text-decoration: none;
            font-size: 14px;
            display: block;
            padding: 5px 10px;
            border-radius: 3px;
            transition: background-color 0.2s;
        }
        .sidebar a:hover {
            background-color: #1f2428;
        }
        .sidebar a.active {
            background-color: #1f6feb;
            color: white;
        }
        /* Search box */
        .search-box {
            margin-bottom: 20px;
            position: relative;
        }
        .search-box input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #30363d;
            border-radius: 6px;
            background: #0d1117;
            color: #c9d1d9;
            font-size: 14px;
        }
        .search-box input:focus {
            outline: none;
            border-color: #58a6ff;
        }
        .search-box input::placeholder {
            color: #8b949e;
        }
        .content {
            margin-left: 320px;
            flex: 1;
            padding: 20px 40px;
            background: #0d1117;
            min-height: 100vh;
        }
        .markdown-body {
            max-width: 980px;
            margin: 0 auto;
            background: #0d1117;
            color: #c9d1d9;
        }
        /* Override github-markdown styles for dark mode */
        .markdown-body h1 {
            color: #f0f6fc;
            border-bottom-color: #30363d;
            font-size: 2.5em !important;
            margin-top: 24px;
            margin-bottom: 16px;
        }
        .markdown-body h2 {
            color: #f0f6fc;
            border-bottom-color: #30363d;
            font-size: 2em !important;
            margin-top: 24px;
            margin-bottom: 16px;
        }
        .markdown-body h3 {
            color: #f0f6fc;
            font-size: 1.5em !important;
            margin-top: 24px;
            margin-bottom: 16px;
        }
        .markdown-body h4 {
            color: #f0f6fc;
            font-size: 1.25em !important;
            margin-top: 24px;
            margin-bottom: 16px;
        }
        .markdown-body h5 {
            color: #f0f6fc;
            font-size: 1.1em !important;
            margin-top: 24px;
            margin-bottom: 16px;
        }
        .markdown-body h6 {
            color: #f0f6fc;
            font-size: 1em !important;
            margin-top: 24px;
            margin-bottom: 16px;
        }
        .markdown-body a {
            color: #58a6ff;
        }
        .markdown-body a:hover {
            color: #79c0ff;
        }
        .markdown-body table th,
        .markdown-body table td {
            border: 1px solid #30363d;
        }
        .markdown-body table tr {
            background-color: #0d1117;
            border-top: 1px solid #30363d;
        }
        .markdown-body table tr:nth-child(2n) {
            background-color: #161b22;
        }
        .markdown-body code {
            background-color: rgba(110,118,129,0.4);
            color: #e6edf3;
        }
        .markdown-body pre {
            background-color: #161b22;
            border: 1px solid #30363d;
        }
        .markdown-body blockquote {
            color: #8b949e;
            border-left-color: #3b434b;
        }
        .markdown-body .highlight pre,
        .markdown-body pre {
            background-color: #161b22;
        }
        .doc-section {
            margin-bottom: 60px;
            border-bottom: 2px solid #30363d;
            padding-bottom: 40px;
        }
        .doc-section:last-child {
            border-bottom: none;
        }
        .back-to-top {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1f6feb;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            text-decoration: none;
            display: none;
            z-index: 1000;
            border: 1px solid #30363d;
        }
        .back-to-top:hover {
            background: #58a6ff;
            color: white;
        }
        @media (max-width: 768px) {
            .sidebar {
                position: relative;
                width: 100%;
                height: auto;
                border-right: none;
                border-bottom: 1px solid #30363d;
            }
            .content {
                margin-left: 0;
            }
        }
        .toc {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .toc h3 {
            margin-top: 0;
            color: #f0f6fc;
        }
        .toc ul {
            margin-left: 20px;
        }
        .toc a {
            color: #58a6ff;
            text-decoration: none;
        }
        .toc a:hover {
            text-decoration: underline;
        }
        /* Mermaid diagrams */
        .mermaid {
            text-align: center;
            margin: 20px 0;
            background: #161b22;
            padding: 20px;
            border-radius: 6px;
            border: 1px solid #30363d;
        }
        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        ::-webkit-scrollbar-track {
            background: #161b22;
        }
        ::-webkit-scrollbar-thumb {
            background: #30363d;
            border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #484f58;
        }
        /* Hide elements for search */
        .hidden {
            display: none !important;
        }
        /* Highlight search results */
        .highlight {
            background-color: #ffd33d;
            color: #24292e;
            padding: 2px;
            border-radius: 3px;
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <script>
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'dark',
            themeVariables: {
                primaryColor: '#1f6feb',
                primaryTextColor: '#f0f6fc',
                primaryBorderColor: '#30363d',
                lineColor: '#58a6ff',
                secondaryColor: '#161b22',
                background: '#0d1117',
                mainBkg: '#161b22',
                textColor: '#c9d1d9'
            }
        });
    </script>
</head>
<body>
    <div class="container">
        <nav class="sidebar">
            <h1>NestJS GraphQL Microservices</h1>
            <div class="search-box">
                <input type="text" id="search-input" placeholder="Search documentation..." />
            </div>
            ${navigation}
            <div style="position: absolute; bottom: 20px; left: 20px; right: 20px; text-align: center; color: #8b949e; font-size: 12px; border-top: 1px solid #30363d; padding-top: 15px;">
                Author: Nicolas Rocchi
            </div>
        </nav>
        <main class="content">
            <div class="markdown-body">
                ${content}
            </div>
            <a href="#top" class="back-to-top" id="back-to-top">↑ Back to Top</a>
        </main>
    </div>
    <script>
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Update active link
                    document.querySelectorAll('.sidebar a').forEach(link => {
                        link.classList.remove('active');
                    });
                    this.classList.add('active');
                }
            });
        });

        // Show/hide back to top button
        const backToTop = document.getElementById('back-to-top');
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                backToTop.style.display = 'block';
            } else {
                backToTop.style.display = 'none';
            }
        });

        // Back to top functionality
        backToTop.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Search functionality
        const searchInput = document.getElementById('search-input');
        const docSections = document.querySelectorAll('.doc-section');
        const sidebarLinks = document.querySelectorAll('.sidebar a');

        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            
            if (searchTerm.length < 2) {
                // Show all sections and links if search is too short
                docSections.forEach(section => section.classList.remove('hidden'));
                sidebarLinks.forEach(link => link.parentElement.classList.remove('hidden'));
                return;
            }

            // Search in content
            docSections.forEach(section => {
                const content = section.textContent.toLowerCase();
                if (content.includes(searchTerm)) {
                    section.classList.remove('hidden');
                    // Highlight search term (basic implementation)
                    // Note: This is a simple approach, for production use a proper highlighting library
                } else {
                    section.classList.add('hidden');
                }
            });

            // Filter sidebar links
            sidebarLinks.forEach(link => {
                const linkText = link.textContent.toLowerCase();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (linkText.includes(searchTerm) || (targetSection && !targetSection.classList.contains('hidden'))) {
                    link.parentElement.classList.remove('hidden');
                } else {
                    link.parentElement.classList.add('hidden');
                }
            });
        });

        // Highlight active section on scroll
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    document.querySelectorAll('.sidebar a').forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === '#' + id) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, observerOptions);

        // Observe all sections
        docSections.forEach(section => {
            observer.observe(section);
        });
    </script>
</body>
</html>`;

// Generate navigation HTML
function generateNavigation(structure) {
  let nav = '';
  structure.forEach(section => {
    nav += `<h2>${section.title}</h2><ul>`;
    section.files.forEach(file => {
      const id = file.replace(/\//g, '-').replace('.md', '');
      let title = path.basename(file, '.md').replace(/^\d+-/, '').replace(/-/g, ' ');
      // Special case for README.md
      if (file === 'README.md') {
        title = 'Home';
      }
      // Capitalize first letter of each word
      title = title.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
      nav += `<li><a href="#${id}">${title}</a></li>`;
    });
    nav += '</ul>';
  });
  return nav;
}

// Process markdown content
function processMarkdown(content) {
  // Convert Mermaid code blocks
  content = content.replace(/```mermaid\n([\s\S]*?)```/g, '<div class="mermaid">$1</div>');
  
  // Convert markdown to HTML
  let html = marked(content);
  
  // Fix relative links to other documents
  html = html.replace(/href="\.\/([^"]+)"/g, (match, path) => {
    const anchor = path.replace(/\//g, '-').replace('.md', '');
    return `href="#${anchor}"`;
  });
  
  // Fix internal anchor links (e.g., #overview becomes properly formatted)
  html = html.replace(/href="#([^"]+)"/g, (match, anchor) => {
    // Clean up the anchor to match our ID generation
    const cleanAnchor = anchor.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .trim();
    return `href="#${cleanAnchor}"`;
  });
  
  return html;
}

// Generate complete documentation
async function generateDocs() {
  const docsDir = path.join(__dirname, '..', 'docs');
  const outputFile = path.join(__dirname, '..', 'docs', 'all-documentation.html');
  
  let allContent = '';
  const navigation = generateNavigation(docStructure);
  
  // Add table of contents
  allContent += '<div class="toc"><h3>Table of Contents</h3><ul>';
  docStructure.forEach(section => {
    allContent += `<li><strong>${section.title}</strong><ul>`;
    section.files.forEach(file => {
      const id = file.replace(/\//g, '-').replace('.md', '');
      let title = path.basename(file, '.md').replace(/^\d+-/, '').replace(/-/g, ' ');
      // Special case for README.md
      if (file === 'README.md') {
        title = 'Home';
      }
      // Capitalize first letter of each word
      title = title.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
      allContent += `<li><a href="#${id}">${title}</a></li>`;
    });
    allContent += '</ul></li>';
  });
  allContent += '</ul></div>';
  
  // Process each documentation file
  for (const section of docStructure) {
    for (const file of section.files) {
      const filePath = path.join(docsDir, file);
      const id = file.replace(/\//g, '-').replace('.md', '');
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const html = processMarkdown(content);
        
        allContent += `<div id="${id}" class="doc-section">`;
        allContent += html;
        allContent += '</div>';
      } catch (err) {
        console.error(`Error reading ${file}:`, err.message);
      }
    }
  }
  
  // Generate final HTML
  const finalHtml = htmlTemplate('Complete Documentation', navigation, allContent);
  
  // Write output file
  fs.writeFileSync(outputFile, finalHtml);
  console.log(`✅ Documentation generated successfully!`);
  console.log(`📄 Output: ${outputFile}`);
  console.log(`\nTo view the documentation:`);
  console.log(`1. Open the file in your browser`);
  console.log(`2. Or run: npx serve docs`);
}

// Run the generator
generateDocs().catch(console.error);
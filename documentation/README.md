# CppBook Documentation Website

This directory contains the source code for the official CppBook documentation and download website.

It is built with React 19, TypeScript, Tailwind CSS, Lucide icons, and Vite. It is completely standalone, client-side only, and decoupled from the main CppBook Electron desktop application, making it directly deployable to static web hosting platforms such as Vercel, Netlify, Cloudflare Pages, or GitHub Pages.

## Project Structure

```text
documentation/
├── src/
│   ├── components/
│   │   ├── layout/       # Header, Footer, DocsLayout, DocsSidebar, DocsTOC
│   │   └── ui/           # SearchModal, CodeBlock, PlatformTabs, MonacoPreviewMock, Diagrams, Callout
│   ├── data/             # docsContent.ts, downloadsData.ts, releasesData.ts, searchIndex.ts
│   ├── pages/            # HomePage, DocsOverviewPage, DocPage, DownloadsPage, ReleasesPage, NotFoundPage
│   ├── types/            # TypeScript interfaces
│   ├── App.tsx           # Client-side router and theme controller
│   └── main.tsx          # Application entry point
├── dist/                 # Production static build output
├── index.html            # HTML entry
├── vite.config.ts        # Vite configuration
└── tailwind.config.js    # Tailwind theme configuration
```

## Local Development

To run the documentation site locally:

```bash
cd documentation
npm install
npm run dev
```

The site will start at `http://localhost:5173`.

## Production Build

To build the static website for deployment:

```bash
npm run build
```

This generates optimized static HTML, JavaScript, and CSS files in the `documentation/dist/` directory.

## Deploying to Vercel

1. In the Vercel dashboard, click **Add New Project** and import the CppBook repository.
2. Under **Root Directory**, set the path to `documentation`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Click **Deploy**.

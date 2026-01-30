# Notes on usage

* For development, `npm run dev` to start localhost:4321 dev server, and automatically rebuilding files on changes.
* Pages in src/pages can be markdown (.md, .mdx) or .astro. Both contain a frontmatter section (lines starting with ---) for including other files (eg components, layouts, styles), metadata (title, date etc.), and Javascript code that runs at build time.
* html in .astro files can use included *components*, Typscript inside <script> tags, and CSS inside <style> tags; all server side compiled.
* Components in src/components are reusable portions of html/css/js that can be included in pages via <ComponentName> - effectively an #include - they are typically used for reusable parts of a page like headers, footers etc.
* Layouts in src/layouts are a type of component that, instead of acting like a "leaf node" in a page like the above type of components, rather acts like a frame, that is, it defines the whole page layout, and you modify it (parameterize it) by injecting the content that varies across pages. Example: A blog post layout - it defines the header, footer, and the general layout of a blog post, and you inject the title, date, and content of the blog post into it.
* Scripts in src/scripts can be included as well; like everything in src/, they are processed at build time (eg you can use Typescript; they are obfuscated etc.). To keep scripts unobfuscated / away from server side compiling, put them in public/ (see below)
* CSS is described in files in src/styles that are included, and inside astro files inside <style> tags
* static artifacts - things you don't want to be processed by Astro - like pdfs, images, or scripts you want to keep as is - go into public/
* src/assets is for artifacts like images that may be resized or processed by Astro
* src/content is similar to pages but think of it more as a DB of pages (eg blog posts) queried elsewhere

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

function convertHtmlToMarkdown(htmlFile) {
    const content = fs.readFileSync(htmlFile, 'utf8');
    const $ = cheerio.load(content);
    
    // Extract main content
    const mainContent = $('main.wrapper.text');
    if (!mainContent.length) return null;
    
    const mdContent = [];
    
    // Add chapter number if exists
    const chapterDiv = mainContent.find('div.chapter');
    if (chapterDiv.length) {
        mdContent.push(`# ${chapterDiv.text().trim()}\n`);
    }
    
    // Add title
    const title = mainContent.find('h1');
    if (title.length) {
        mdContent.push(`# ${title.text().trim()}\n`);
    }
    
    // Process paragraphs and other elements
    mainContent.find('p, h2, h3, h4, figure, pre').each((_, element) => {
        const $element = $(element);
        
        if (element.tagName === 'p') {
            const text = $element.text().trim();
            if (text) {
                mdContent.push(`<div dir='rtl'>${text}</div>\n`);
            }
        }
        else if (['h2', 'h3', 'h4'].includes(element.tagName)) {
            const level = parseInt(element.tagName[1]);
            const text = $element.text().trim();
            if (text) {
                mdContent.push(`${'#'.repeat(level)} ${text}\n`);
            }
        }
        else if (element.tagName === 'figure') {
            // Handle images
            const img = $element.find('img');
            if (img.length) {
                const src = img.attr('src') || '';
                const alt = img.attr('alt') || '';
                mdContent.push(`![${alt}](${src})\n`);
            }
            
            // Handle code blocks
            if ($element.hasClass('code')) {
                const figcaption = $element.find('figcaption');
                if (figcaption.length) {
                    mdContent.push(`<div dir='ltr'>\n`);
                    mdContent.push(`**${figcaption.text().trim()}**\n`);
                    const pre = $element.find('pre');
                    if (pre.length) {
                        mdContent.push('```\n');
                        mdContent.push(pre.text());
                        mdContent.push('\n```\n');
                    }
                    mdContent.push('</div>\n');
                }
            }
        }
    });
    
    return mdContent.join('\n');
}

function processDirectory() {
    // Create markdown directory if it doesn't exist
    const markdownDir = path.join(__dirname, 'markdown');
    if (!fs.existsSync(markdownDir)) {
        fs.mkdirSync(markdownDir);
    }
    
    // Process all HTML files
    fs.readdirSync(__dirname).forEach(file => {
        if (file.endsWith('.html') && !file.startsWith('.')) {
            console.log(`Converting ${file}...`);
            const mdContent = convertHtmlToMarkdown(path.join(__dirname, file));
            
            if (mdContent) {
                const mdFile = path.join(markdownDir, file.replace('.html', '.md'));
                fs.writeFileSync(mdFile, mdContent, 'utf8');
            }
        }
    });
}

processDirectory(); 
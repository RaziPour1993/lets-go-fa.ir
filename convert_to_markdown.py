#!/usr/bin/env python3
import os
import re
from bs4 import BeautifulSoup
import html2text
from pathlib import Path

def convert_html_to_markdown(html_file):
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    soup = BeautifulSoup(content, 'html.parser')
    
    # Extract main content
    main_content = soup.find('main', class_='wrapper text')
    if not main_content:
        return None
    
    # Initialize markdown content
    md_content = []
    
    # Add chapter number if exists
    chapter_div = main_content.find('div', class_='chapter')
    if chapter_div:
        md_content.append(f"# {chapter_div.text.strip()}\n")
    
    # Add title
    title = main_content.find('h1')
    if title:
        md_content.append(f"# {title.text.strip()}\n")
    
    # Process paragraphs and other elements
    for element in main_content.find_all(['p', 'h2', 'h3', 'h4', 'figure', 'pre']):
        if element.name == 'p':
            # Handle paragraphs with RTL text
            text = element.get_text().strip()
            if text:
                md_content.append(f"<div dir='rtl'>{text}</div>\n")
        
        elif element.name in ['h2', 'h3', 'h4']:
            # Handle headings with RTL text
            level = int(element.name[1])
            text = element.get_text().strip()
            if text:
                md_content.append(f"{'#' * level} {text}\n")
        
        elif element.name == 'figure':
            # Handle images
            img = element.find('img')
            if img:
                src = img.get('src', '')
                alt = img.get('alt', '')
                md_content.append(f"![{alt}]({src})\n")
            
            # Handle code blocks
            if 'class' in element.attrs and 'code' in element['class']:
                figcaption = element.find('figcaption')
                if figcaption:
                    md_content.append(f"<div dir='ltr'>\n")
                    md_content.append(f"**{figcaption.text.strip()}**\n")
                    pre = element.find('pre')
                    if pre:
                        md_content.append("```\n")
                        md_content.append(pre.text)
                        md_content.append("\n```\n")
                    md_content.append("</div>\n")
    
    return '\n'.join(md_content)

def process_directory():
    # Create markdown directory if it doesn't exist
    markdown_dir = Path('markdown')
    markdown_dir.mkdir(exist_ok=True)
    
    # Process all HTML files
    for html_file in Path('.').glob('*.html'):
        if html_file.name.startswith('.'):
            continue
            
        print(f"Converting {html_file.name}...")
        md_content = convert_html_to_markdown(html_file)
        
        if md_content:
            md_file = markdown_dir / f"{html_file.stem}.md"
            with open(md_file, 'w', encoding='utf-8') as f:
                f.write(md_content)

if __name__ == '__main__':
    process_directory() 
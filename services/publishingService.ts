
import { GoogleGenAI } from "@google/genai";
import { Book } from '../types';

// Declare types for UMD libraries loaded via script tags
declare global {
    interface Window {
        docx: any;
        jspdf: any;
        JSZip: any;
        saveAs: any;
    }
}

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY! });

const generateBackCover = async (title: string, synopsis: string): Promise<string> => {
    const model = 'imagen-4.0-generate-001';

    const promptGenResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a book cover art director. A book has the title "${title}" and synopsis "${synopsis}". I need a back cover image. Create a prompt for an AI image generator. The back cover should be less detailed than the front cover, providing a complementary texture, color scheme, or a subtle thematic element that matches the front cover's mood. It needs to have empty space where the synopsis text would typically be placed. Do not include any text in the image prompt itself. Describe a design that is aesthetically pleasing but doesn't distract from the text that will be overlaid later.`,
        config: {
            temperature: 0.7,
        }
    });

    const imagePrompt = promptGenResponse.text;

    const response = await ai.models.generateImages({
        model,
        prompt: imagePrompt,
        config: {
            numberOfImages: 1,
            aspectRatio: '3:4',
            outputMimeType: 'image/jpeg',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

const createWordDocument = async (book: Book, authorName: string): Promise<Blob> => {
    const { Document, Packer, Paragraph, HeadingLevel, PageBreak, AlignmentType } = window.docx;

    const chaptersContent = book.chapters.flatMap(chapter => [
        new Paragraph({ text: chapter.title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
        ...chapter.content.split('\n').filter(p => p.trim() !== '').map(p => new Paragraph({ text: p })),
        new Paragraph({ children: [new PageBreak()] })
    ]);
    // Remove last page break
    chaptersContent.pop();


    const doc = new Document({
        creator: "AI Book Weaver",
        title: book.title,
        description: book.synopsis,
        sections: [{
            children: [
                new Paragraph({ text: book.title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: `by ${authorName}`, alignment: AlignmentType.CENTER }),
                new Paragraph({ children: [new PageBreak()] }),
                new Paragraph({ text: `Copyright © ${new Date().getFullYear()} ${authorName}`, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "All rights reserved.", alignment: AlignmentType.CENTER }),
                new Paragraph({ children: [new PageBreak()] }),
                ...chaptersContent
            ]
        }]
    });
    return Packer.toBlob(doc);
};

const createPdfDocument = (book: Book, authorName: string): Blob => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        unit: 'pt',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 72; // 1 inch in points
    const usableWidth = pageWidth - (2 * margin);

    // Title page
    doc.setFont('times', 'normal');
    doc.setFontSize(36);
    doc.text(book.title, pageWidth / 2, pageHeight / 3, { align: 'center', maxWidth: usableWidth });
    doc.setFontSize(18);
    doc.text(`by ${authorName}`, pageWidth / 2, pageHeight / 3 + 40, { align: 'center' });

    // Copyright page
    doc.addPage();
    doc.setFontSize(10);
    doc.text(`Copyright © ${new Date().getFullYear()} ${authorName}`, pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });
    doc.text("All rights reserved.", pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });

    let y = margin;

    const addText = (text: string, size: number, style: string) => {
        doc.setFontSize(size);
        doc.setFont('times', style);
        const lines = doc.splitTextToSize(text, usableWidth);
        for (const line of lines) {
            if (y + size > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += size * 1.2;
        }
    };

    book.chapters.forEach(chapter => {
        doc.addPage();
        y = margin;
        addText(chapter.title, 18, 'bold');
        y += 18; // Extra space after title
        chapter.content.split('\n').filter(p => p.trim() !== '').forEach(paragraph => {
            addText(paragraph, 12, 'normal');
            y += 12; // Paragraph spacing
        });
    });

    return doc.output('blob');
};

const createPublishingGuide = (book: Book): string => {
    const sanitizedTitle = book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `Hello Author,

Congratulations on completing your book, "${book.title}", with AI Book Weaver! This guide will help you take the next steps in your self-publishing journey.

================================
PART 1: YOUR PUBLISHING ASSETS
================================

This package contains everything you need to publish your book:

- MASTER DOCUMENT (${sanitizedTitle}.docx): This is your most important file! It's a Microsoft Word document that you can edit. You will upload this file directly to publishing platforms like Amazon KDP.

- PRINT-READY PDF (${sanitizedTitle}.pdf): A high-quality PDF, perfect for creating paperback versions of your book or for sharing directly.

- COVER ART (cover_front.jpg & cover_back.jpg): Professional front and back cover images for your book.

================================
PART 2: CREATING EBOOK FILES (EPUB & MOBI/KINDLE)
================================

You have your master DOCX file. Now, let's turn it into the formats needed for e-readers.

**The Easy Way: Let the Stores Do It!**
Nearly all major platforms, especially Amazon Kindle Direct Publishing (KDP), will automatically and perfectly convert your .docx file into their specific ebook format when you upload it. This is the recommended method for the best results.

**Doing It Yourself (for advanced users or testing):**
If you want to create the files yourself to preview on an e-reader, you can use a free tool.

Tool Recommendation: Calibre (calibre-ebook.com)
Calibre is a powerful, free desktop app for managing and converting ebooks.

1.  **Install Calibre:** Download it from their official website.
2.  **Add Your Book:** Drag your '${sanitizedTitle}.docx' file into Calibre.
3.  **Convert:**
    *   Select your book in Calibre and click the "Convert books" button.
    *   For most e-readers (Apple Books, Kobo, Nook): Set the "Output format" in the top-right corner to **EPUB**. Click OK.
    *   For Amazon Kindle: Set the "Output format" to **AZW3** (this is the modern format for Kindle, replacing the older MOBI). Click OK.

Your converted files will be saved in your Calibre library folder.

================================
PART 3: PUBLISHING ON AMAZON KDP
================================

1.  **Create an Account:** Go to kdp.amazon.com and sign up.
2.  **Create a New Title:** In your dashboard, choose to create a new "Kindle eBook".
3.  **Book Details:**
    -   Title: ${book.title}
    -   Author: {{authorName}}
    -   Description: Use the synopsis from your book as a starting point. This is your book's sales pitch!
    -   Keywords & Categories: Choose search terms and genres that fit your book.
4.  **Manuscript Upload:** Upload the **.docx file** provided in this package. KDP will handle the conversion to Kindle format.
5.  **Cover Upload:** Upload the 'cover_front.jpg' image.
6.  **Pricing:** Set your price and publish! Your book will be live on Amazon stores worldwide within a few days.

Good luck on your publishing adventure!
`;
};

export const createEpubFile = async (
    book: Book,
    authorName: string,
    onProgress: (message: string) => void
): Promise<void> => {
    try {
        onProgress("Initializing EPUB creation...");
        const zip = new window.JSZip();
        const sanitizedTitle = book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const bookId = `urn:uuid:${book.id}`;

        // 1. mimetype file (must be first and uncompressed)
        zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

        // 2. META-INF/container.xml
        const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="EPUB/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
        zip.file("META-INF/container.xml", containerXml);

        // 3. Fetch cover image
        onProgress("Processing cover image...");
        const coverBlob = await fetch(book.coverImageUrl).then(r => r.blob());
        const coverFileExtension = coverBlob.type.split('/')[1] || 'jpeg';
        const coverFileName = `cover.${coverFileExtension}`;
        zip.file(`EPUB/images/${coverFileName}`, coverBlob);

        // 4. Create content files (CSS, Nav, Cover, Chapters)
        onProgress("Generating book content...");

        // CSS
        const styleCss = `body { font-family: serif; line-height: 1.6; } p { margin: 0 0 1em 0; text-indent: 1.5em; } h2 { text-align: center; font-size: 1.5em; margin: 2em 0 1em; }`;
        zip.file("EPUB/css/style.css", styleCss);

        // Nav
        const navLiElements = book.chapters.map((chap, i) => `<li><a href="text/chapter_${i + 1}.xhtml">${chap.title}</a></li>`).join('\n      ');
        const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Table of Contents</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h2>Table of Contents</h2>
    <ol>
      ${navLiElements}
    </ol>
  </nav>
</body>
</html>`;
        zip.file("EPUB/nav.xhtml", navXhtml);

        // Cover page
        const coverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" style="margin: 0; padding: 0;">
<head>
  <title>${book.title}</title>
  <style>
    body, html { padding: 0; margin: 0; height: 100%; }
    svg { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="100%" height="100%" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid meet">
    <image width="600" height="800" xlink:href="images/${coverFileName}"/>
  </svg>
</body>
</html>`;
        zip.file("EPUB/cover.xhtml", coverXhtml);
        
        // Chapter pages
        book.chapters.forEach((chapter, i) => {
            const chapterContent = chapter.content.split('\n').filter(p => p.trim() !== '').map(p => `<p>${p}</p>`).join('\n  ');
            const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapter.title}</title>
  <link href="../css/style.css" rel="stylesheet" type="text/css"/>
</head>
<body>
  <h2>${chapter.title}</h2>
  ${chapterContent}
</body>
</html>`;
            zip.file(`EPUB/text/chapter_${i+1}.xhtml`, chapterXhtml);
        });

        // 5. Create content.opf
        onProgress("Building package manifest...");
        const manifestItems = [
            `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
            `<item id="css" href="css/style.css" media-type="text/css"/>`,
            `<item id="cover-image" href="images/${coverFileName}" media-type="${coverBlob.type}" properties="cover-image"/>`,
            `<item id="cover-page" href="cover.xhtml" media-type="application/xhtml+xml"/>`,
            ...book.chapters.map((c, i) => `<item id="chapter_${i+1}" href="text/chapter_${i+1}.xhtml" media-type="application/xhtml+xml"/>`)
        ];
        const spineItems = [
            `<itemref idref="cover-page" linear="no"/>`,
            ...book.chapters.map((c, i) => `<itemref idref="chapter_${i+1}"/>`)
        ];
        
        const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${book.title}</dc:title>
    <dc:creator id="creator">${authorName}</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="BookId">${bookId}</dc:identifier>
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0] + 'Z'}</meta>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine>
    ${spineItems.join('\n    ')}
  </spine>
</package>`;
        zip.file("EPUB/content.opf", contentOpf);
        
        // 6. Generate and save
        onProgress("Assembling EPUB file...");
        const zipBlob = await zip.generateAsync({
            type: "blob",
            mimeType: "application/epub+zip"
        });
        
        onProgress("Download starting...");
        window.saveAs(zipBlob, `${sanitizedTitle}.epub`);
    } catch (error) {
        console.error("Failed to create EPUB file:", error);
        if (error instanceof Error) {
            onProgress(`Error: ${error.message}`);
        } else {
            onProgress("An unknown error occurred during EPUB creation.");
        }
        throw error;
    }
};


export const createPublishingPackage = async (
    book: Book,
    authorName: string,
    onProgress: (message: string) => void
): Promise<void> => {
    try {
        const sanitizedTitle = book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        onProgress("Designing back cover...");
        const backCoverUrl = await generateBackCover(book.title, book.synopsis);

        onProgress("Formatting Word document...");
        const wordBlob = await createWordDocument(book, authorName);

        onProgress("Generating PDF version...");
        const pdfBlob = createPdfDocument(book, authorName);

        onProgress("Writing publishing guide...");
        const guideText = createPublishingGuide(book).replace(/{{authorName}}/g, authorName);

        onProgress("Preparing images...");
        const frontCoverBlob = await fetch(book.coverImageUrl).then(r => r.blob());
        const backCoverBlob = await fetch(backCoverUrl).then(r => r.blob());

        onProgress("Zipping files...");
        const zip = new window.JSZip();

        zip.file(`${sanitizedTitle}.docx`, wordBlob);
        zip.file(`${sanitizedTitle}.pdf`, pdfBlob);
        zip.file("publishing_guide.txt", guideText);
        zip.file("cover_front.jpg", frontCoverBlob);
        zip.file("cover_back.jpg", backCoverBlob);

        const zipBlob = await zip.generateAsync({ type: "blob" });

        onProgress("Download starting...");
        window.saveAs(zipBlob, `${sanitizedTitle}_publishing_package.zip`);
    } catch (error) {
        console.error("Failed to create publishing package:", error);
        if (error instanceof Error) {
            onProgress(`Error: ${error.message}`);
        } else {
            onProgress("An unknown error occurred.");
        }
        throw error;
    }
};

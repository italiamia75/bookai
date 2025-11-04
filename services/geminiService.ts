import { GoogleGenAI, Type } from "@google/genai";
import { Book, GenerationProgress } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Gemini API key not found. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// Agent 1: The Outliner
const generateOutline = async (description: string, pages: number, language: string, userTitle?: string) => {
  const wordsPerPage = 300;
  const totalWords = pages * wordsPerPage;
  const chapters = Math.max(5, Math.round(pages / 10));
  const wordsPerChapter = Math.round(totalWords / chapters);

  const model = 'gemini-2.5-pro';

  const titleInstruction = userTitle
    ? `The book's title is provided by the user and must be: "${userTitle}". You must adopt this title.`
    : `1.  Create a compelling, professional book title.`;

  const prompt = `
    You are a master book architect. Based on the following description, create a detailed plan for a book.
    The user wants a book of approximately ${pages} pages. I have calculated this to be roughly ${chapters} chapters of ${wordsPerChapter} words each.
    
    IMPORTANT: Your entire output, including the title, synopsis, and all chapter details, must be in ${language}.

    Your task is to:
    ${titleInstruction}
    2.  Write a brief, engaging synopsis (2-3 paragraphs).
    3.  Generate a detailed chapter-by-chapter outline. For each chapter, provide a title and a 2-3 sentence summary of its key points, plot, or themes.

    Book Description: "${description}"

    Return the entire output as a single, valid JSON object.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'The title of the book.'
      },
      synopsis: {
        type: Type.STRING,
        description: 'A brief synopsis of the book.'
      },
      outline: {
        type: Type.ARRAY,
        description: 'An array of chapter outlines.',
        items: {
          type: Type.OBJECT,
          properties: {
            chapter_title: {
              type: Type.STRING,
              description: 'The title of the chapter.'
            },
            chapter_summary: {
              type: Type.STRING,
              description: 'A summary of the chapter\'s content.'
            },
          },
          required: ['chapter_title', 'chapter_summary'],
        },
      },
    },
    required: ['title', 'synopsis', 'outline'],
  };

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.7,
    },
  });

  try {
    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText) as { title: string; synopsis: string; outline: { chapter_title: string; chapter_summary: string }[] };
    // If user supplied a title, make sure the response object uses it.
    if(userTitle) {
      parsed.title = userTitle;
    }
    return parsed;
  } catch (e) {
    console.error("Failed to parse JSON from Gemini:", response.text);
    throw new Error("The AI failed to generate a valid book outline. Please try again.");
  }
};

// Agent 2: The Chapter Writer
const writeChapter = async (bookTitle: string, bookSynopsis: string, chapterTitle: string, chapterSummary: string, words: number, language: string) => {
  const model = 'gemini-2.5-flash';

  const prompt = `
    You are an expert ghostwriter, known for your eloquent and engaging prose.
    You are writing a chapter for a book titled "${bookTitle}".
    The book's overall synopsis is: "${bookSynopsis}".

    Your current task is to write the full content for the chapter titled "${chapterTitle}".
    This chapter should cover the following points: ${chapterSummary}.

    Write approximately ${words} words. The content should be well-structured, coherent, and captivating for the reader.
    Do not repeat the chapter title in the content. Start directly with the chapter's text.
    Format the text in paragraphs. Use markdown for any special formatting if necessary.

    IMPORTANT: Your entire response must be written in ${language}.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.6,
    }
  });

  return response.text.trim();
};

// Agent 3: The Cover Designer
const generateCover = async (title: string, synopsis: string, keywords: string) => {
  const model = 'imagen-4.0-generate-001';

  const keywordsPromptPart = keywords.trim()
    ? `\n\nThe user has provided the following style preferences or keywords to inspire the cover. Make sure to incorporate these ideas into your prompt: "${keywords}"`
    : '';

  const promptGenResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a creative book cover art director. Based on the following title and synopsis, create a detailed, vivid prompt for an AI image generator. The prompt should describe a visually stunning and marketable book cover, including style (e.g., minimalist, photorealistic, abstract), mood, color palette, and key symbolic elements. Do not include any text in the image prompt itself.

      Title: "${title}"
      Synopsis: "${synopsis}"
      ${keywordsPromptPart}
      `,
      config: {
        temperature: 0.8,
      }
  });
  
  const imagePrompt = promptGenResponse.text;

  const response = await ai.models.generateImages({
    model,
    prompt: imagePrompt,
    config: {
      numberOfImages: 1,
      aspectRatio: '3:4', // Common book cover aspect ratio
      outputMimeType: 'image/jpeg',
    },
  });

  const base64ImageBytes = response.generatedImages[0].image.imageBytes;
  return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateBook = async (
  description: string,
  pages: number,
  coverKeywords: string,
  userTitle: string,
  language: string,
  onProgress: (progress: GenerationProgress) => void
): Promise<Omit<Book, 'id' | 'author'>> => {
  try {
    onProgress({ status: "Architecting Outline", message: "The master architect is drafting the blueprint..." });
    const { title, synopsis, outline } = await generateOutline(description, pages, language, userTitle);
    onProgress({ status: "Outline Complete", message: "Blueprint ready. The writers are gathering." });

    const wordsPerChapter = Math.round((pages * 300) / outline.length);
    const chapters = [];

    let chapterCount = 1;
    for (const chapterOutline of outline) {
      onProgress({
        status: "Writing Chapters",
        current: chapterCount,
        total: outline.length,
        message: `Penning Chapter ${chapterCount}: "${chapterOutline.chapter_title}"`,
      });
      const content = await writeChapter(
        title,
        synopsis,
        chapterOutline.chapter_title,
        chapterOutline.chapter_summary,
        wordsPerChapter,
        language
      );
      chapters.push({ title: chapterOutline.chapter_title, content });
      chapterCount++;
    }

    onProgress({ status: "Designing Cover", message: "The artist is preparing the canvas..." });
    const coverImageUrl = await generateCover(title, synopsis, coverKeywords);

    onProgress({ status: "Finalizing", message: "Binding the pages and adding the final touches." });

    return { title, synopsis, coverImageUrl, chapters, language };
  } catch (error) {
    console.error("Book generation failed:", error);
    if (error instanceof Error) {
        onProgress({ status: "Error", message: `An error occurred: ${error.message}` });
    } else {
        onProgress({ status: "Error", message: "An unknown error occurred during book generation." });
    }
    throw error;
  }
};
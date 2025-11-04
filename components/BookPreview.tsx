
import React, { useState } from 'react';
import { Book } from '../types';
import { DownloadIcon } from './icons';
import DownloadModal from './DownloadModal';

interface BookPreviewProps {
  book: Book;
  onBack: () => void;
}

const BookPreview: React.FC<BookPreviewProps> = ({ book, onBack }) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(-1); // -1 for cover/TOC
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChapterSelect = (index: number) => {
    setCurrentChapterIndex(index);
  };

  const renderContent = () => {
    if (currentChapterIndex === -1) {
      return (
        <div className="text-center p-8 h-full overflow-y-auto">
            <h2 className="text-4xl font-bold font-serif mb-2 text-brand-accent">{book.title}</h2>
            <div className="flex items-center justify-center gap-2 text-lg text-slate-400 mb-4">
                <span>by {book.author}</span>
                <span className="text-xs bg-brand-secondary/50 text-slate-300 px-2 py-0.5 rounded-full">{book.language}</span>
            </div>
            <p className="text-slate-300 italic max-w-2xl mx-auto mb-8">{book.synopsis}</p>
            <h3 className="text-2xl font-semibold mb-4 border-b border-brand-secondary/30 pb-2">Table of Contents</h3>
            <ul className="space-y-2 text-left max-w-md mx-auto">
              {book.chapters.map((chapter, index) => (
                <li key={index}>
                  <button 
                    onClick={() => handleChapterSelect(index)}
                    className="w-full text-left p-2 rounded-md hover:bg-brand-secondary/50 transition-colors"
                  >
                   {index + 1}. {chapter.title}
                  </button>
                </li>
              ))}
            </ul>
        </div>
      );
    }
    
    const chapter = book.chapters[currentChapterIndex];
    return (
      <div className="p-8 md:p-12 h-full overflow-y-auto">
        <h2 className="text-3xl font-bold font-serif mb-6 text-brand-accent">{chapter.title}</h2>
        <div 
          className="prose prose-invert max-w-none font-serif text-lg leading-relaxed text-slate-300"
          dangerouslySetInnerHTML={{ __html: chapter.content.replace(/\n/g, '<br />') }} 
        />
      </div>
    );
  };
  
  return (
    <>
      <div className="w-full max-w-7xl mx-auto bg-brand-primary shadow-2xl rounded-lg flex flex-col md:flex-row min-h-[80vh]">
        <div className="w-full md:w-1/3 lg:w-1/4 bg-brand-dark p-6 flex flex-col">
          <img src={book.coverImageUrl} alt={`${book.title} cover`} className="w-full rounded-md shadow-lg mb-6 aspect-[3/4] object-cover" />
          <button onClick={() => setCurrentChapterIndex(-1)} className="w-full text-left p-3 rounded-md hover:bg-brand-secondary/50 transition-colors font-semibold mb-2">Table of Contents</button>
          <div className="flex-grow overflow-y-auto">
              {book.chapters.map((chapter, index) => (
                  <button
                      key={index}
                      onClick={() => handleChapterSelect(index)}
                      className={`w-full text-left p-3 rounded-md transition-colors text-sm ${currentChapterIndex === index ? 'bg-brand-secondary font-bold' : 'hover:bg-brand-secondary/50'}`}
                  >
                      {index + 1}. {chapter.title}
                  </button>
              ))}
          </div>
          <div className='space-y-2 mt-6'>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-brand-secondary text-white font-bold py-2 px-4 rounded-md hover:bg-brand-secondary/80 transition-colors flex items-center justify-center gap-2">
              <DownloadIcon className="w-5 h-5" />
              Download for Publishing
            </button>
            <button onClick={onBack} className="w-full bg-brand-accent text-brand-dark font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity">
              Back to Library
            </button>
          </div>
        </div>
        <div className="w-full md:w-2/3 lg:w-3/4 bg-brand-primary/50">
          {renderContent()}
        </div>
      </div>
      {isModalOpen && (
        <DownloadModal book={book} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};

export default BookPreview;
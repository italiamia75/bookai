
import React, { useState } from 'react';
import { Book } from '../types';
import { createPublishingPackage, createEpubFile } from '../services/publishingService';
import LoadingSpinner from './LoadingSpinner';

interface DownloadModalProps {
  book: Book;
  onClose: () => void;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ book, onClose }) => {
  const [authorName, setAuthorName] = useState(book.author || '');
  const [isLoading, setIsLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');

  const handleDownload = async (downloadFn: (book: Book, authorName: string, onProgress: (msg: string) => void) => Promise<void>) => {
    if (!authorName.trim()) {
      alert('Please enter an author name.');
      return;
    }
    setIsLoading(true);
    setProgressMessage('');
    try {
      await downloadFn(book, authorName, setProgressMessage);
      // Delay closing to allow user to see the "Download starting..." message
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 2000);
    } catch (error) {
        setIsLoading(false);
        // Error message is already set by the service
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-brand-primary p-8 rounded-lg shadow-2xl max-w-lg w-full m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Download Options</h2>
          <button onClick={onClose} disabled={isLoading} className="text-slate-400 hover:text-white transition-colors">&times;</button>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-center h-48">
            <LoadingSpinner />
            <p className="text-slate-300 mt-4">{progressMessage || 'Preparing your files...'}</p>
          </div>
        ) : progressMessage.startsWith("Error:") ? (
            <div className="text-center h-48 flex flex-col justify-center">
                <p className="text-red-400">{progressMessage}</p>
                <button
                    onClick={() => { setProgressMessage(''); setAuthorName(authorName);}} // Keep author name
                    className="mt-4 w-full bg-brand-secondary text-white font-bold py-2 px-4 rounded-md hover:bg-brand-secondary/80 transition-colors"
                >
                    Try Again
                </button>
            </div>
        ) : (
          <>
            <p className="text-slate-300 mb-4">
              Enter a pen name for the title page and copyright notice, then choose your desired download format.
            </p>
            <div className="mb-6">
              <label htmlFor="authorName" className="block text-sm font-medium text-slate-300 mb-1">Author / Pen Name</label>
              <input
                type="text"
                id="authorName"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g., Jane Austen"
                className="w-full bg-brand-dark border border-brand-secondary/50 rounded-md p-2 text-white focus:ring-brand-accent focus:border-brand-accent"
              />
            </div>

            <div className="space-y-4">
                <div className="bg-brand-dark/50 p-4 rounded-md">
                    <h3 className="font-semibold text-white">eBook File</h3>
                    <p className="text-sm text-slate-400 mt-1 mb-3">
                        A single .epub file for use with most e-readers (Apple Books, Kobo, etc.).
                    </p>
                    <button
                        onClick={() => handleDownload(createEpubFile)}
                        disabled={!authorName.trim()}
                        className="w-full bg-brand-secondary text-white font-bold py-2 rounded-md hover:bg-brand-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Download .epub
                    </button>
                </div>
                <div className="bg-brand-dark/50 p-4 rounded-md">
                    <h3 className="font-semibold text-white">Full Publishing Package</h3>
                    <p className="text-sm text-slate-400 mt-1 mb-3">
                        A .zip file with your master .docx (for editing & converting to all ebook formats like MOBI), a print-ready .pdf, cover art, and a publishing guide.
                    </p>
                    <button
                        onClick={() => handleDownload(createPublishingPackage)}
                        disabled={!authorName.trim()}
                        className="w-full bg-brand-accent text-brand-dark font-bold py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Download .zip Package
                    </button>
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DownloadModal;

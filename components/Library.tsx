import React from 'react';
import { User, Book, GenerationJob } from '../types';
import { BookOpenIcon, TrashIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface LibraryProps {
  user: User;
  onSelectBook: (book: Book) => void;
  onDeleteBook: (bookId: string) => void;
  generationJobs: GenerationJob[];
}

const GenerationJobCard: React.FC<{ job: GenerationJob }> = ({ job }) => (
    <div className="relative group cursor-wait border-2 border-dashed border-brand-secondary/50 rounded-md p-4 flex flex-col items-center justify-center text-center aspect-[3/4] bg-brand-dark/30">
         <div className="absolute inset-0 bg-brand-secondary/30 animate-pulse rounded-md"></div>
        <LoadingSpinner />
        <h3 className="mt-4 font-semibold text-white truncate group-hover:text-brand-accent transition-colors">{job.tempTitle}</h3>
        <p className="text-xs text-slate-400 mt-1">{job.progress.status}...</p>
        {job.progress.current && job.progress.total && (
          <div className="w-full bg-brand-primary rounded-full h-1.5 my-2">
            <div 
              className="bg-brand-accent h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${(job.progress.current / job.progress.total) * 100}%` }}>
            </div>
          </div>
        )}
        <p className="text-xs text-slate-300">{job.progress.message}</p>
    </div>
);

const Library: React.FC<LibraryProps> = ({ user, onSelectBook, onDeleteBook, generationJobs }) => {
  if (user.books.length === 0 && generationJobs.length === 0) {
    return (
      <div className="text-center max-w-lg mx-auto p-8 bg-brand-primary/50 backdrop-blur-sm rounded-lg shadow-2xl">
        <BookOpenIcon className="w-16 h-16 mx-auto text-brand-accent mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">Your Library is Empty</h2>
        <p className="text-slate-300">
          You haven't generated any books yet. Go to the generator to weave your first story!
        </p>
      </div>
    );
  }

  const handleDeleteClick = (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation(); // Prevent the onSelectBook from firing
    onDeleteBook(bookId);
  };

  return (
    <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-white">My Library</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {generationJobs.map(job => <GenerationJobCard key={job.jobId} job={job} />)}
            {user.books.map(book => (
                <div 
                    key={book.id} 
                    className="group cursor-pointer relative"
                    onClick={() => onSelectBook(book)}
                >
                    <img 
                        src={book.coverImageUrl} 
                        alt={`${book.title} cover`}
                        className="w-full aspect-[3/4] object-cover rounded-md shadow-lg transform group-hover:scale-105 group-hover:shadow-2xl transition-all duration-300"
                    />
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md flex items-start justify-end p-2">
                        <button 
                            onClick={(e) => handleDeleteClick(e, book.id)}
                            className="p-1.5 bg-red-600/80 rounded-full text-white hover:bg-red-500 transition-colors"
                            title="Delete Book"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <h3 className="mt-3 font-semibold text-white truncate group-hover:text-brand-accent transition-colors">{book.title}</h3>
                </div>
            ))}
        </div>
    </div>
  );
};

export default Library;
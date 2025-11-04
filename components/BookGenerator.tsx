import React, { useState, useMemo } from 'react';
import { Book, CostTier, GenerationProgress, User, BookGenerationDetails } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface BookGeneratorProps {
  costTiers: CostTier[];
  user: User;
  onStartGeneration: (details: BookGenerationDetails, cost: number) => void;
  onNavigateToStore: () => void;
}

const LANGUAGES = [
    'English', 'Italian', 'Spanish', 'French', 'German', 'Portuguese', 'Japanese', 'Russian', 'Chinese (Simplified)'
];

const BookGenerator: React.FC<BookGeneratorProps> = ({ costTiers, user, onStartGeneration, onNavigateToStore }) => {
  const [description, setDescription] = useState('');
  const [coverKeywords, setCoverKeywords] = useState('');
  const [pages, setPages] = useState(30);
  const [authorName, setAuthorName] = useState(user.name);
  const [bookTitle, setBookTitle] = useState('');
  const [isAiTitle, setIsAiTitle] = useState(true);
  const [language, setLanguage] = useState('English');

  const cost = useMemo(() => {
    const sortedTiers = [...costTiers].sort((a, b) => a.pages - b.pages);
    const applicableTier = sortedTiers.find(tier => pages <= tier.pages);
    return applicableTier ? applicableTier.credits : Infinity;
  }, [pages, costTiers]);

  const hasEnoughCredits = user.credits >= cost;

  const handleGenerate = async () => {
    if (!description.trim()) {
      alert('Please provide a description for your book.');
      return;
    }
    if (!authorName.trim()) {
        alert('Please provide an author name.');
        return;
    }
    if (!isAiTitle && !bookTitle.trim()) {
        alert('Please provide a book title or let the AI suggest one.');
        return;
    }
    if (!hasEnoughCredits) {
      alert("You don't have enough credits to generate this book.");
      return;
    }

    onStartGeneration({
        description,
        pages,
        coverKeywords,
        authorName,
        title: isAiTitle ? '' : bookTitle,
        language,
    }, cost);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-brand-primary/50 backdrop-blur-sm rounded-lg shadow-2xl">
      <h1 className="text-4xl font-bold text-center mb-2 text-white">Bring Your Story to Life</h1>
      <p className="text-center text-slate-300 mb-8">Describe your book idea, and our AI agents will write it for you.</p>

      <div className="space-y-6">
        <div>
          <label htmlFor="description" className="block text-lg font-medium text-brand-accent mb-2">Book Description</label>
          <textarea
            id="description"
            rows={6}
            className="w-full bg-brand-dark/50 border border-brand-secondary/50 rounded-md p-4 text-white placeholder-slate-400 focus:ring-brand-accent focus:border-brand-accent transition-colors"
            placeholder="e.g., A sci-fi noir thriller set on a cyberpunk Mars, where a detective hunts for a rogue AI that has stolen corporate secrets..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
            <label htmlFor="language" className="block text-lg font-medium text-brand-accent mb-2">Language</label>
            <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-brand-dark/50 border border-brand-secondary/50 rounded-md p-3 text-white focus:ring-brand-accent focus:border-brand-accent transition-colors"
            >
                {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="authorName" className="block text-lg font-medium text-brand-accent mb-2">Author Name</label>
                <input
                    id="authorName"
                    type="text"
                    className="w-full bg-brand-dark/50 border border-brand-secondary/50 rounded-md p-3 text-white placeholder-slate-400 focus:ring-brand-accent focus:border-brand-accent transition-colors"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="bookTitle" className="block text-lg font-medium text-brand-accent mb-2">Book Title</label>
                <input
                    id="bookTitle"
                    type="text"
                    className="w-full bg-brand-dark/50 border border-brand-secondary/50 rounded-md p-3 text-white placeholder-slate-400 focus:ring-brand-accent focus:border-brand-accent transition-colors disabled:opacity-50"
                    placeholder="Enter a title..."
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    disabled={isAiTitle}
                />
            </div>
        </div>

        <div className="flex items-center justify-end -mt-2">
            <input 
                type="checkbox" 
                id="ai-title-toggle" 
                className="h-4 w-4 rounded border-gray-300 text-brand-secondary focus:ring-brand-secondary"
                checked={isAiTitle}
                onChange={() => setIsAiTitle(!isAiTitle)}
            />
            <label htmlFor="ai-title-toggle" className="ml-2 block text-sm text-slate-300">Let AI suggest a title</label>
        </div>


        <div>
            <label htmlFor="coverKeywords" className="block text-lg font-medium text-brand-accent mb-2">Cover Style Keywords (Optional)</label>
            <input
                id="coverKeywords"
                type="text"
                className="w-full bg-brand-dark/50 border border-brand-secondary/50 rounded-md p-3 text-white placeholder-slate-400 focus:ring-brand-accent focus:border-brand-accent transition-colors"
                placeholder="e.g., minimalist, vintage, watercolor, dark fantasy"
                value={coverKeywords}
                onChange={(e) => setCoverKeywords(e.target.value)}
            />
        </div>

        <div>
          <label htmlFor="pages" className="block text-lg font-medium text-brand-accent mb-4">
            Number of Pages: <span className="font-bold text-white">{pages}</span>
          </label>
          <input
            id="pages"
            type="range"
            min="30"
            max="300"
            step="10"
            value={pages}
            onChange={(e) => setPages(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-brand-dark rounded-lg appearance-none cursor-pointer accent-brand-accent"
          />
        </div>

        <div className="text-center bg-brand-dark/50 p-4 rounded-md space-y-2">
          <p className="text-lg">
            Estimated Cost: <span className="font-bold text-brand-accent">{cost === Infinity ? 'N/A' : `${cost.toLocaleString()} Credits`}</span>
          </p>
          {!hasEnoughCredits && cost !== Infinity && (
            <div>
              <p className="text-red-400">You do not have enough credits for this selection.</p>
              <button onClick={onNavigateToStore} className="mt-2 text-sm bg-brand-secondary text-white font-semibold py-1 px-3 rounded-md hover:bg-brand-secondary/80">
                Purchase Credits
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={!hasEnoughCredits}
          className="w-full bg-brand-accent text-brand-dark font-bold text-lg py-3 px-6 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Weave My Book
        </button>
      </div>
    </div>
  );
};

export default BookGenerator;
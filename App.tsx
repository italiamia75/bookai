import React, { useState, useEffect } from 'react';
import BookGenerator from './components/BookGenerator';
import AdminPanel from './components/AdminPanel';
import { Book, CostTier, User, AdminConfig, BookGenerationDetails, GenerationJob, GenerationProgress, AppNotification } from './types';
import BookPreview from './components/BookPreview';
import { BookOpenIcon, CogIcon, LibraryIcon, UserIcon, LogoutIcon, CreditCardIcon } from './components/icons';
import UserAuth from './components/UserAuth';
import Library from './components/Library';
import CreditStore from './components/CreditStore';
import { generateBook } from './services/geminiService';
import Notifications from './components/Notifications';

// Custom hook for using localStorage
// Fix: Updated the type signature of the setter function to support functional updates,
// which is necessary for updating state correctly within asynchronous operations.
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

const MOCK_USERS: User[] = [
    { id: 'user-1', name: 'Alice', credits: 5000, books: [], birthDate: '1990-05-15' },
    { id: 'user-2', name: 'Bob', credits: 150, books: [] },
    { id: 'user-3', name: 'Charlie (Admin)', credits: 99999, books: [], birthDate: '1985-11-20' },
];

const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  costTiers: [
    { id: '1', pages: 30, credits: 100 },
    { id: '2', pages: 100, credits: 300 },
    { id: '3', pages: 200, credits: 500 },
    { id: '4', pages: 300, credits: 750 },
  ],
  birthdayBonus: {
    enabled: true,
    credits: 250,
    emailTemplate: "Happy Birthday, {{userName}}! To celebrate, we've gifted you {{credits}} credits. Enjoy!"
  }
};

type View = 'generator' | 'library' | 'admin' | 'store';

const App: React.FC = () => {
  const [users, setUsers] = useLocalStorage<User[]>('ai-book-weaver-users', MOCK_USERS);
  const [adminConfig, setAdminConfig] = useLocalStorage<AdminConfig>('ai-book-weaver-admin-config', DEFAULT_ADMIN_CONFIG);
  const [currentUserId, setCurrentUserId] = useLocalStorage<string | null>('ai-book-weaver-current-user-id', null);

  const [activeView, setActiveView] = useState<View>('generator');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const currentUser = users.find(u => u.id === currentUserId);
  const currentUserJobs = generationJobs.filter(job => job.authorName === currentUser?.name); // Simple association

  const addNotification = (type: AppNotification['type'], message: string, details?: string) => {
    const newNotification: AppNotification = {
      id: `notif-${Date.now()}`,
      type,
      message,
      details,
    };
    setNotifications(prev => [...prev, newNotification]);
  };

  const handleLogin = (userId: string) => {
    setCurrentUserId(userId);
    setActiveView('generator');
    setSelectedBook(null);
  };

  const handleRegister = (name: string, birthDate?: string) => {
    const newUser: User = {
        id: `user-${new Date().getTime()}`,
        name,
        credits: 500, // Welcome bonus!
        books: [],
        birthDate: birthDate || undefined,
    };
    setUsers([...users, newUser]);
    handleLogin(newUser.id);
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setActiveView('generator');
  };
  
  const handleStartBookGeneration = (details: BookGenerationDetails, cost: number) => {
    if (!currentUser) return;
    
    // 1. Deduct credits and set view
    setUsers(users.map(u => u.id === currentUser.id ? { ...u, credits: u.credits - cost } : u));
    setActiveView('library');
    setSelectedBook(null);

    // 2. Create and track job
    const jobId = `job-${Date.now()}`;
    const newJob: GenerationJob = { 
        jobId, 
        progress: { status: "Initializing", message: "Contacting AI agents..." },
        tempTitle: details.title || `A New Masterpiece...`,
        authorName: details.authorName // Assuming one user generates one book at a time
    };
    setGenerationJobs(prev => [...prev, newJob]);

    // 3. Start async generation
    (async () => {
        try {
            const onProgress = (p: GenerationProgress) => {
                setGenerationJobs(prevJobs => prevJobs.map(job => 
                    job.jobId === jobId ? { ...job, progress: p } : job
                ));
            };

            const bookData = await generateBook(details.description, details.pages, details.coverKeywords, details.title, details.language, onProgress);
            
            const finalBook: Book = {
                ...bookData,
                id: `book-${Date.now()}`,
                author: details.authorName,
                language: details.language,
            };
            
            setUsers(currentUsers => currentUsers.map(u => 
                u.id === currentUser.id 
                    ? { ...u, books: [finalBook, ...u.books] } // Add to front
                    : u
            ));
            
            setGenerationJobs(prevJobs => prevJobs.filter(j => j.jobId !== jobId));
            
            addNotification('success', `"${finalBook.title}" is complete!`, `Your book is now available in your library.`);
            addNotification('info', `Simulated Email Sent`, `To: ${currentUser.name}\nSubject: Your book "${finalBook.title}" is ready!`);

        } catch (error) {
            console.error("Book generation failed in App:", error);
            setGenerationJobs(prevJobs => prevJobs.filter(j => j.jobId !== jobId));
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            addNotification('error', 'Book Generation Failed', errorMessage);
        }
    })();
  };

  const handleDeleteBook = (bookId: string) => {
    if (!currentUser) return;
    
    const bookToDelete = currentUser.books.find(b => b.id === bookId);
    if (!bookToDelete) return;

    if (window.confirm(`Are you sure you want to permanently delete "${bookToDelete.title}"? This action cannot be undone.`)) {
      setUsers(prevUsers => prevUsers.map(user => {
        if (user.id === currentUser.id) {
          return {
            ...user,
            books: user.books.filter(book => book.id !== bookId)
          };
        }
        return user;
      }));
      addNotification('info', `"${bookToDelete.title}" has been deleted.`);
    }
  };

  const handlePurchaseCredits = (amount: number) => {
    if (!currentUser) return;

    const updatedUsers = users.map(user => {
      if (user.id === currentUser.id) {
        return { ...user, credits: user.credits + amount };
      }
      return user;
    });
    setUsers(updatedUsers);
    addNotification('success', `${amount.toLocaleString()} credits added successfully!`);
    setActiveView('generator'); // Go back to generator after purchase
  };
  
  const selectView = (view: View) => {
    setActiveView(view);
    setSelectedBook(null);
  }

  const renderMainContent = () => {
    if (!currentUser) {
        return <UserAuth users={users} onLogin={handleLogin} onRegister={handleRegister} />;
    }
    if (selectedBook) {
        return <BookPreview book={selectedBook} onBack={() => setSelectedBook(null)} />;
    }
    switch (activeView) {
        case 'generator':
            return <BookGenerator costTiers={adminConfig.costTiers} user={currentUser} onStartGeneration={handleStartBookGeneration} onNavigateToStore={() => setActiveView('store')} />;
        case 'library':
            return <Library user={currentUser} onSelectBook={setSelectedBook} onDeleteBook={handleDeleteBook} generationJobs={currentUserJobs} />;
        case 'admin':
            return <AdminPanel adminConfig={adminConfig} setAdminConfig={setAdminConfig} users={users} setUsers={setUsers} />;
        case 'store':
            return <CreditStore user={currentUser} onPurchase={handlePurchaseCredits} onBack={() => setActiveView('generator')} />;
        default:
            return null;
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark bg-gradient-to-br from-brand-primary to-brand-dark">
      <Notifications notifications={notifications} setNotifications={setNotifications} />
      <header className="p-4 bg-brand-primary/30 backdrop-blur-md sticky top-0 z-10">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BookOpenIcon className="w-8 h-8 text-brand-accent" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">AI Book Weaver</h1>
          </div>
          {currentUser && (
            <div className="flex items-center gap-2 sm:gap-4">
               <button onClick={() => selectView('generator')} className={`p-2 rounded-md transition-colors ${activeView === 'generator' && !selectedBook ? 'bg-brand-secondary text-white' : 'text-slate-300 hover:bg-brand-secondary/50'}`} title="Generator">
                  <BookOpenIcon className="w-6 h-6"/>
               </button>
               <button onClick={() => selectView('library')} className={`p-2 rounded-md transition-colors ${activeView === 'library' && !selectedBook ? 'bg-brand-secondary text-white' : 'text-slate-300 hover:bg-brand-secondary/50'}`} title="My Library">
                  <LibraryIcon className="w-6 h-6"/>
               </button>
               <button onClick={() => selectView('admin')} className={`p-2 rounded-md transition-colors ${activeView === 'admin' && !selectedBook ? 'bg-brand-secondary text-white' : 'text-slate-300 hover:bg-brand-secondary/50'}`} title="Admin Panel">
                  <CogIcon className="w-6 h-6"/>
               </button>
               <div className="h-8 w-px bg-brand-secondary/50 mx-2"></div>
               <button onClick={() => selectView('store')} className="text-right p-2 rounded-md hover:bg-brand-secondary/50 transition-colors" title="Purchase Credits">
                  <p className="font-semibold text-white">{currentUser.name}</p>
                  <div className="flex items-center gap-1">
                     <p className="text-sm text-brand-accent">{currentUser.credits.toLocaleString()} Credits</p>
                     <CreditCardIcon className="w-4 h-4 text-brand-accent/70" />
                  </div>
               </button>
               <button onClick={handleLogout} className="p-2 text-slate-300 hover:bg-brand-secondary/50 rounded-md" title="Logout">
                  <LogoutIcon className="w-6 h-6" />
               </button>
            </div>
          )}
        </nav>
      </header>

      <main className="p-4 sm:p-8">
        {renderMainContent()}
      </main>

       <footer className="text-center p-6 text-slate-400 mt-8">
            <p>&copy; {new Date().getFullYear()} AI Book Weaver. Weaving digital dreams into literary reality.</p>
       </footer>
    </div>
  );
};

export default App;
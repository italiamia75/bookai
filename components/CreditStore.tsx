import React from 'react';
import { User } from '../types';
import { CreditCardIcon } from './icons';

interface CreditStoreProps {
  user: User;
  onPurchase: (credits: number) => void;
  onBack: () => void;
}

interface CreditPackage {
    id: string;
    credits: number;
    price: string;
    description: string;
    bestValue?: boolean;
}

const creditPackages: CreditPackage[] = [
    { id: 'p1', credits: 500, price: '$4.99', description: 'A great start for a short story or novella.' },
    { id: 'p2', credits: 1200, price: '$9.99', description: 'Perfect for crafting your first full novel.', bestValue: true },
    { id: 'p3', credits: 3000, price: '$19.99', description: 'For the dedicated author with many tales to tell.' },
    { id: 'p4', credits: 10000, price: '$49.99', description: 'The ultimate package for the prolific publisher.' },
];

const CreditStore: React.FC<CreditStoreProps> = ({ user, onPurchase, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-brand-primary/50 backdrop-blur-sm rounded-lg shadow-2xl">
      <div className="text-center mb-10">
        <CreditCardIcon className="w-16 h-16 mx-auto text-brand-accent mb-4" />
        <h1 className="text-4xl font-bold text-white mb-2">Credit Store</h1>
        <p className="text-slate-300 mb-4">Purchase credits to continue weaving your literary masterpieces.</p>
        <div className="inline-block bg-brand-dark/50 px-4 py-2 rounded-full">
            <span className="text-slate-300">Your Current Balance: </span>
            <span className="font-bold text-brand-accent text-lg">{user.credits.toLocaleString()} Credits</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {creditPackages.map(pkg => (
          <div key={pkg.id} className={`relative bg-brand-dark/50 p-6 rounded-lg border border-brand-secondary/50 flex flex-col text-center transition-all duration-300 hover:border-brand-accent hover:scale-105`}>
            {pkg.bestValue && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-accent text-brand-dark text-xs font-bold px-3 py-1 rounded-full uppercase">Best Value</div>
            )}
            <h2 className="text-2xl font-bold text-white">{pkg.credits.toLocaleString()} Credits</h2>
            <p className="text-slate-400 my-3 flex-grow">{pkg.description}</p>
            <p className="text-4xl font-extrabold text-brand-accent my-4">{pkg.price}</p>
            <button
              onClick={() => onPurchase(pkg.credits)}
              className="w-full bg-brand-secondary text-white font-bold text-lg py-3 px-6 rounded-md hover:bg-brand-secondary/80 transition-colors"
            >
              Purchase
            </button>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-12">
        <button onClick={onBack} className="text-slate-300 hover:text-white hover:underline transition-colors">
            &larr; Back to Generator
        </button>
      </div>
    </div>
  );
};

export default CreditStore;
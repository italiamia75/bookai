import React, { useState } from 'react';
import { AdminConfig, CostTier, User } from '../types';
import { GiftIcon, PlusIcon, TrashIcon } from './icons';

interface AdminPanelProps {
  adminConfig: AdminConfig;
  setAdminConfig: (config: AdminConfig) => void;
  users: User[];
  setUsers: (users: User[]) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ adminConfig, setAdminConfig, users, setUsers }) => {
  const { costTiers, birthdayBonus } = adminConfig;
  
  const [newTierPages, setNewTierPages] = useState<number>(30);
  const [newTierCredits, setNewTierCredits] = useState<number>(100);
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [creditsToAdd, setCreditsToAdd] = useState<number>(1000);

  const [bonusCredits, setBonusCredits] = useState(birthdayBonus.credits);
  const [emailTemplate, setEmailTemplate] = useState(birthdayBonus.emailTemplate);
  const [lastCheckResult, setLastCheckResult] = useState<string[] | null>(null);


  const handleSetCostTiers = (tiers: CostTier[]) => {
    setAdminConfig({ ...adminConfig, costTiers: tiers });
  };

  const handleAddTier = () => {
    if (costTiers.some(t => t.pages === newTierPages)) {
      alert("A tier with this page count already exists.");
      return;
    }
    const newTier: CostTier = {
      id: new Date().toISOString(),
      pages: newTierPages,
      credits: newTierCredits,
    };
    const sortedTiers = [...costTiers, newTier].sort((a, b) => a.pages - b.pages);
    handleSetCostTiers(sortedTiers);
  };

  const handleRemoveTier = (id: string) => {
    handleSetCostTiers(costTiers.filter(tier => tier.id !== id));
  };

  const handleAddCredits = () => {
    if (!selectedUserId || creditsToAdd <= 0) {
      alert("Please select a user and enter a valid credit amount.");
      return;
    }
    const updatedUsers = users.map(user => {
      if (user.id === selectedUserId) {
        return { ...user, credits: user.credits + creditsToAdd };
      }
      return user;
    });
    setUsers(updatedUsers);
    setCreditsToAdd(1000); // Reset for next use
  };
  
  const handleSaveBonusConfig = () => {
    setAdminConfig({
        ...adminConfig,
        birthdayBonus: {
            ...birthdayBonus,
            credits: bonusCredits,
            emailTemplate: emailTemplate,
        }
    });
    alert("Birthday bonus settings saved!");
  };

  const handleCheckBirthdays = () => {
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // JS months are 0-indexed
    const todayDay = today.getDate();
    
    const results: string[] = [];
    const updatedUsers = users.map(user => {
      if (user.birthDate) {
        const [year, month, day] = user.birthDate.split('-').map(Number);
        if (month === todayMonth && day === todayDay) {
          const personalizedEmail = emailTemplate
            .replace(/{{userName}}/g, user.name)
            .replace(/{{credits}}/g, bonusCredits.toLocaleString());
            
          results.push(`✅ Awarded ${bonusCredits} credits to ${user.name} for their birthday.`);
          results.push(`✉️ Simulated sending email: "${personalizedEmail}"`);
          
          return { ...user, credits: user.credits + bonusCredits };
        }
      }
      return user;
    });
    
    if (results.length === 0) {
      results.push("No user birthdays today.");
    }

    setUsers(updatedUsers);
    setLastCheckResult(results);
  };

  return (
    <div className="bg-brand-primary/50 backdrop-blur-sm p-8 rounded-lg shadow-2xl max-w-4xl mx-auto space-y-12">
      {/* Cost Configuration Section */}
      <div>
        <h2 className="text-3xl font-bold mb-6 text-brand-accent">Cost Configuration</h2>
        <p className="mb-8 text-slate-300">
          Set the credit cost for generating books based on the maximum number of pages.
        </p>

        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-3 gap-4 font-bold text-slate-400 px-4">
            <span>Max Pages</span>
            <span>Credit Cost</span>
            <span>Action</span>
          </div>
          {costTiers.map(tier => (
            <div key={tier.id} className="grid grid-cols-3 gap-4 items-center bg-brand-dark/50 p-4 rounded-md">
              <span>{tier.pages} pages</span>
              <span>{tier.credits} credits</span>
              <button
                onClick={() => handleRemoveTier(tier.id)}
                className="text-red-400 hover:text-red-300 transition-colors justify-self-start"
              >
                <TrashIcon className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-brand-secondary/30 pt-6">
          <h3 className="text-xl font-semibold mb-4 text-white">Add New Cost Tier</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label htmlFor="pages" className="block text-sm font-medium text-slate-300 mb-1">Max Pages</label>
              <input type="number" id="pages" value={newTierPages} onChange={(e) => setNewTierPages(parseInt(e.target.value, 10))} className="w-full bg-brand-dark border border-brand-secondary/50 rounded-md p-2 text-white focus:ring-brand-accent focus:border-brand-accent" min="30" step="10" />
            </div>
            <div>
              <label htmlFor="credits" className="block text-sm font-medium text-slate-300 mb-1">Credit Cost</label>
              <input type="number" id="credits" value={newTierCredits} onChange={(e) => setNewTierCredits(parseInt(e.target.value, 10))} className="w-full bg-brand-dark border border-brand-secondary/50 rounded-md p-2 text-white focus:ring-brand-accent focus:border-brand-accent" min="1" />
            </div>
            <button onClick={handleAddTier} className="flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-secondary/80 text-white font-bold py-2 px-4 rounded-md transition-colors w-full">
              <PlusIcon className="w-5 h-5" /> Add Tier
            </button>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div>
        <h2 className="text-3xl font-bold mb-6 text-brand-accent">User Management</h2>
        <p className="mb-8 text-slate-300">
          View user balances and add credits to their accounts.
        </p>

        <div className="space-y-4 mb-8">
            <div className="grid grid-cols-3 gap-4 font-bold text-slate-400 px-4">
                <span>User Name</span>
                <span>Credits</span>
                <span>Books Owned</span>
            </div>
            {users.map(user => (
                <div key={user.id} className="grid grid-cols-3 gap-4 items-center bg-brand-dark/50 p-4 rounded-md">
                    <span className="font-semibold text-white">{user.name}</span>
                    <span className="text-brand-accent">{user.credits.toLocaleString()}</span>
                    <span>{user.books.length}</span>
                </div>
            ))}
        </div>

        <div className="border-t border-brand-secondary/30 pt-6">
            <h3 className="text-xl font-semibold mb-4 text-white">Add Credits to User</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label htmlFor="user-select" className="block text-sm font-medium text-slate-300 mb-1">User</label>
                    <select id="user-select" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full bg-brand-dark border border-brand-secondary/50 rounded-md p-2 text-white focus:ring-brand-accent focus:border-brand-accent">
                        {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="credits-to-add" className="block text-sm font-medium text-slate-300 mb-1">Credits to Add</label>
                    <input type="number" id="credits-to-add" value={creditsToAdd} onChange={(e) => setCreditsToAdd(parseInt(e.target.value, 10))} className="w-full bg-brand-dark border border-brand-secondary/50 rounded-md p-2 text-white focus:ring-brand-accent focus:border-brand-accent" min="1" step="100"/>
                </div>
                <button onClick={handleAddCredits} className="flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-secondary/80 text-white font-bold py-2 px-4 rounded-md transition-colors w-full">
                    <PlusIcon className="w-5 h-5" /> Add Credits
                </button>
            </div>
        </div>
      </div>

       {/* Automated Rewards Section */}
       <div>
        <h2 className="text-3xl font-bold mb-6 text-brand-accent">Automated Rewards</h2>
        <p className="mb-8 text-slate-300">
          Configure automated credit rewards for user events, like birthdays.
        </p>
        <div className="bg-brand-dark/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-white">Birthday Bonus</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="bonus-credits" className="block text-sm font-medium text-slate-300 mb-1">Bonus Credits</label>
                    <input type="number" id="bonus-credits" value={bonusCredits} onChange={(e) => setBonusCredits(parseInt(e.target.value, 10))} className="w-full bg-brand-dark border border-brand-secondary/50 rounded-md p-2 text-white" min="0" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="email-template" className="block text-sm font-medium text-slate-300 mb-1">Email Template</label>
                     <textarea id="email-template" value={emailTemplate} onChange={(e) => setEmailTemplate(e.target.value)} rows={4} className="w-full bg-brand-dark border border-brand-secondary/50 rounded-md p-2 text-white" />
                     {/* FIX: The double curly braces syntax {{...}} is for objects in JSX. To display the literal string, it must be wrapped in a string literal within a single pair of braces. */}
                     <p className="text-xs text-slate-400 mt-1">Use <code className="bg-brand-primary p-0.5 rounded-sm">{`{{userName}}`}</code> and <code className="bg-brand-primary p-0.5 rounded-sm">{`{{credits}}`}</code> as placeholders.</p>
                </div>
            </div>
            <button onClick={handleSaveBonusConfig} className="mt-4 bg-brand-secondary hover:bg-brand-secondary/80 text-white font-bold py-2 px-4 rounded-md transition-colors">
                Save Bonus Settings
            </button>
        </div>

        <div className="mt-6 border-t border-brand-secondary/30 pt-6">
            <h3 className="text-xl font-semibold mb-4 text-white">Trigger Rewards</h3>
            <button onClick={handleCheckBirthdays} className="flex items-center justify-center gap-2 bg-brand-accent hover:opacity-90 text-brand-dark font-bold py-2 px-4 rounded-md transition-colors w-full md:w-auto">
                <GiftIcon className="w-5 h-5" /> Check for Birthdays & Send Rewards
            </button>
            {lastCheckResult && (
                <div className="mt-4 p-4 bg-brand-dark/50 rounded-md text-sm text-slate-300 space-y-1">
                    <h4 className="font-semibold text-white mb-2">Last Check Results:</h4>
                    {lastCheckResult.map((line, index) => <p key={index} className="font-mono">{line}</p>)}
                </div>
            )}
        </div>
       </div>
    </div>
  );
};

export default AdminPanel;

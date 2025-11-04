import React, { useState } from 'react';
import { User } from '../types';
import { UserIcon } from './icons';

interface UserAuthProps {
  users: User[];
  onLogin: (userId: string) => void;
  onRegister: (name: string, birthDate?: string) => void;
}

const UserAuth: React.FC<UserAuthProps> = ({ users, onLogin, onRegister }) => {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [newUserName, setNewUserName] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');

  const handleLogin = () => {
    if (selectedUserId) {
      onLogin(selectedUserId);
    }
  };

  const handleRegister = () => {
    if (newUserName.trim()) {
      onRegister(newUserName.trim(), birthDate);
    } else {
        alert("Please enter a name to register.");
    }
  };

  const renderLogin = () => (
     <>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-slate-300 mb-8">Please select your profile to continue.</p>
        <div className="space-y-6">
            <div>
                <label htmlFor="user-select" className="sr-only">Select User</label>
                <select
                    id="user-select"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-secondary/50 rounded-md p-3 text-white text-lg focus:ring-brand-accent focus:border-brand-accent"
                >
                    {users.map((user) => (
                    <option key={user.id} value={user.id}>
                        {user.name}
                    </option>
                    ))}
                </select>
            </div>
            <button
                onClick={handleLogin}
                className="w-full bg-brand-accent text-brand-dark font-bold text-lg py-3 px-6 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                disabled={!selectedUserId}
            >
            Continue
            </button>
        </div>
        <p className="mt-6 text-sm text-slate-400">
            New here?{' '}
            <button onClick={() => setView('register')} className="font-semibold text-brand-accent hover:underline">
                Create an Account
            </button>
        </p>
     </>
  );

  const renderRegister = () => (
    <>
        <h1 className="text-3xl font-bold text-white mb-2">Create Your Account</h1>
        <p className="text-slate-300 mb-8">Join our community of AI-powered authors.</p>
        <div className="space-y-4">
            <div>
                <label htmlFor="new-user-name" className="sr-only">Your Name</label>
                <input
                    type="text"
                    id="new-user-name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-brand-dark border border-brand-secondary/50 rounded-md p-3 text-white text-lg focus:ring-brand-accent focus:border-brand-accent"
                />
            </div>
            <div>
                <label htmlFor="birth-date" className="block text-sm font-medium text-slate-300 mb-1 text-left">Birth Date (Optional)</label>
                <input
                    type="date"
                    id="birth-date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-secondary/50 rounded-md p-3 text-white text-lg focus:ring-brand-accent focus:border-brand-accent"
                />
            </div>
            <button
                onClick={handleRegister}
                className="w-full bg-brand-accent text-brand-dark font-bold text-lg py-3 px-6 rounded-md hover:opacity-90 transition-opacity !mt-6"
            >
             Sign Up
            </button>
        </div>
        <p className="mt-6 text-sm text-slate-400">
            Already have an account?{' '}
            <button onClick={() => setView('login')} className="font-semibold text-brand-accent hover:underline">
                Log In
            </button>
        </p>
    </>
  );


  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-brand-primary/50 backdrop-blur-sm rounded-lg shadow-2xl text-center">
      <UserIcon className="w-16 h-16 mx-auto text-brand-accent mb-4" />
      {view === 'login' ? renderLogin() : renderRegister()}
    </div>
  );
};

export default UserAuth;
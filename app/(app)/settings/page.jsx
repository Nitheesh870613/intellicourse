'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { Settings, User, Bell, Shield, Palette, Database, ChevronRight, Loader2, Check, Download, Trash2, X } from 'lucide-react';

const settingsSections = [
    { id: 'profile', icon: User, label: 'Profile', description: 'Manage your account details' },
    { id: 'notifications', icon: Bell, label: 'Notifications', description: 'Configure alerts and emails' },
    { id: 'privacy', icon: Shield, label: 'Privacy', description: 'Control your data and security' },
    { id: 'appearance', icon: Palette, label: 'Appearance', description: 'Customize the look and feel' },
    { id: 'data', icon: Database, label: 'Data', description: 'Export or delete your data' },
];

function Toggle({ checked, onChange, disabled }) {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-[#836FFF]' : 'bg-[#272732]'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'left-7' : 'left-1'
                    }`}
            />
        </button>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const { signOut } = useClerk();
    const [activeSection, setActiveSection] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState('');

    const [profile, setProfile] = useState({ displayName: '', lastName: '', email: '' });
    const [notifications, setNotifications] = useState({ emailUpdates: true, quizReminders: true, aiTips: true });
    const [privacy, setPrivacy] = useState({ publicProfile: false, shareActivity: true });
    const [appearance, setAppearance] = useState({ density: 'comfortable', accentColor: 'purple' });

    const [loaded, setLoaded] = useState({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!loaded[activeSection]) {
            loadSectionData(activeSection);
        }
    }, [activeSection]);

    const loadSectionData = async (section) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/settings/${section}`);
            if (!response.ok) throw new Error('Failed to load settings');
            const data = await response.json();

            switch (section) {
                case 'profile': setProfile(data); break;
                case 'notifications': setNotifications(data); break;
                case 'privacy': setPrivacy(data); break;
                case 'appearance': setAppearance(data); break;
            }

            setLoaded(prev => ({ ...prev, [section]: true }));
        } catch (err) {
            setError('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async (section, data) => {
        setIsSaving(true);
        setSaveSuccess(false);
        setError('');
        try {
            const response = await fetch(`/api/settings/${section}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to save settings');
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (err) {
            setError('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/settings/export');
            if (!response.ok) throw new Error('Failed to export data');
            const data = await response.json();

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `intellicourse-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to export data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') return;

        setIsDeleting(true);
        try {
            const response = await fetch('/api/settings/delete-account', { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete account');
            await signOut();
            router.push('/');
        } catch (err) {
            setError('Failed to delete account');
            setIsDeleting(false);
        }
    };

    const renderContent = () => {
        if (isLoading && !loaded[activeSection]) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
            );
        }

        switch (activeSection) {
            case 'profile':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                            <input
                                type="text"
                                value={profile.displayName}
                                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-[#0f0f17] border border-white/5 text-white focus:outline-none focus:border-white/10"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                            <input
                                type="text"
                                value={profile.lastName}
                                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-[#0f0f17] border border-white/5 text-white focus:outline-none focus:border-white/10"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email (read-only)</label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="w-full px-4 py-3 rounded-xl bg-[#0f0f17] border border-white/5 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <button
                            onClick={() => saveSettings('profile', profile)}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#272732] hover:bg-[#32323f] disabled:opacity-50 text-white font-medium transition-colors border border-white/5"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4" /> : null}
                            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
                        </button>
                    </div>
                );

            case 'notifications':
                return (
                    <div className="space-y-4">
                        {[
                            { key: 'emailUpdates', label: 'Email Updates', desc: 'Receive course and platform updates' },
                            { key: 'quizReminders', label: 'Quiz Reminders', desc: 'Reminders to complete quizzes' },
                            { key: 'aiTips', label: 'AI Tips', desc: 'Get AI-powered learning suggestions' },
                        ].map(item => (
                            <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-[#0f0f17] border border-white/5">
                                <div>
                                    <p className="text-white font-medium">{item.label}</p>
                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                </div>
                                <Toggle
                                    checked={notifications[item.key]}
                                    onChange={(v) => {
                                        const newData = { ...notifications, [item.key]: v };
                                        setNotifications(newData);
                                        saveSettings('notifications', newData);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                );

            case 'privacy':
                return (
                    <div className="space-y-4">
                        {[
                            { key: 'publicProfile', label: 'Public Profile', desc: 'Allow others to see your profile' },
                            { key: 'shareActivity', label: 'Share Activity', desc: 'Show your learning activity' },
                        ].map(item => (
                            <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-[#0f0f17] border border-white/5">
                                <div>
                                    <p className="text-white font-medium">{item.label}</p>
                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                </div>
                                <Toggle
                                    checked={privacy[item.key]}
                                    onChange={(v) => {
                                        const newData = { ...privacy, [item.key]: v };
                                        setPrivacy(newData);
                                        saveSettings('privacy', newData);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                );

            case 'appearance':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-3">Density</label>
                            <div className="flex gap-3">
                                {['comfortable', 'compact'].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => {
                                            const newData = { ...appearance, density: d };
                                            setAppearance(newData);
                                            saveSettings('appearance', newData);
                                        }}
                                        className={`flex-1 p-4 rounded-lg border capitalize ${appearance.density === d
                                                ? 'bg-[#272732] border-white/10 text-white'
                                                : 'bg-[#0f0f17] border-white/5 text-gray-400 hover:border-white/10'
                                            }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-3">Accent Color</label>
                            <div className="flex gap-3">
                                {[
                                    { name: 'purple', color: '#836FFF' },
                                    { name: 'blue', color: '#6366f1' },
                                    { name: 'pink', color: '#FF7AD9' },
                                ].map((c) => (
                                    <button
                                        key={c.name}
                                        onClick={() => {
                                            const newData = { ...appearance, accentColor: c.name };
                                            setAppearance(newData);
                                            saveSettings('appearance', newData);
                                        }}
                                        className={`flex items-center gap-2 flex-1 p-4 rounded-lg border capitalize ${appearance.accentColor === c.name
                                                ? 'bg-[#272732] border-white/10 text-white'
                                                : 'bg-[#0f0f17] border-white/5 text-gray-400 hover:border-white/10'
                                            }`}
                                    >
                                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'data':
                return (
                    <div className="space-y-6">
                        <div className="p-6 rounded-xl bg-[#0f0f17] border border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                                <Download className="w-5 h-5 text-gray-400" />
                                <h4 className="text-white font-medium">Export Your Data</h4>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">Download all your courses, progress, and settings as a JSON file.</p>
                            <button
                                onClick={handleExportData}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#272732] hover:bg-[#32323f] text-white text-sm font-medium transition-colors border border-white/5"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Export All Data
                            </button>
                        </div>

                        <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/10">
                            <div className="flex items-center gap-3 mb-3">
                                <Trash2 className="w-5 h-5 text-red-400" />
                                <h4 className="text-red-400 font-medium">Danger Zone</h4>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">Permanently delete your account and all associated data.</p>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors border border-red-500/20"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f17]">
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-xl bg-[#1c1c29] border border-white/5 shadow-[0_6px_30px_rgba(0,0,0,0.20)]">
                        <Settings className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Settings</h1>
                        <p className="text-gray-400">Manage your preferences</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        {settingsSections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-left ${activeSection === section.id
                                        ? 'bg-[#1c1c29] border border-white/10'
                                        : 'bg-[#1c1c29] border border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <div className="p-2 rounded-lg bg-[#272732]">
                                    <section.icon className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">{section.label}</p>
                                    <p className="text-xs text-gray-500">{section.description}</p>
                                </div>
                                <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${activeSection === section.id ? 'rotate-90' : ''}`} />
                            </button>
                        ))}
                    </div>

                    <div className="lg:col-span-2 p-6 rounded-xl bg-[#1c1c29] border border-white/5 shadow-[0_6px_30px_rgba(0,0,0,0.20)]">
                        <h2 className="text-xl font-semibold text-white mb-6">
                            {settingsSections.find((s) => s.id === activeSection)?.label}
                        </h2>
                        {renderContent()}
                    </div>
                </div>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1c1c29] rounded-xl p-6 max-w-md w-full border border-white/5 shadow-[0_6px_30px_rgba(0,0,0,0.20)]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Delete Account</h3>
                            <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-gray-400 mb-4">This will permanently delete your account and all associated data.</p>
                        <p className="text-sm text-gray-500 mb-2">Type <strong className="text-white">DELETE</strong> to confirm:</p>
                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[#0f0f17] border border-white/5 text-white mb-4 focus:outline-none"
                            placeholder="Type DELETE"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-[#272732] border border-white/5 text-white font-medium hover:bg-[#32323f]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-400 font-medium border border-red-500/20"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

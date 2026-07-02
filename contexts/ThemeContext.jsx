'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
	const [isDarkMode, setIsDarkMode] = useState(false);

	// Load theme from localStorage on mount
	useEffect(() => {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme === 'dark') {
			setIsDarkMode(true);
			document.documentElement.classList.add('dark');
		}
	}, []);

	const toggleTheme = () => {
		setIsDarkMode(prev => {
			const newValue = !prev;
			if (newValue) {
				document.documentElement.classList.add('dark');
				localStorage.setItem('theme', 'dark');
			} else {
				document.documentElement.classList.remove('dark');
				localStorage.setItem('theme', 'light');
			}
			return newValue;
		});
	};

	return (
		<ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}

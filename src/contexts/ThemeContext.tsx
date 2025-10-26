import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('writingMateTheme') as Theme;
    if (savedTheme) {
      console.log('🎨 Loading saved theme:', savedTheme);
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Default to dark mode instead of system preference
      const initialTheme = 'dark';
      console.log('🎨 Using default theme:', initialTheme);
      setTheme(initialTheme);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('🎨 Toggling theme from', theme, 'to', newTheme);
    setTheme(newTheme);
    localStorage.setItem('writingMateTheme', newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('✅ Dark class added to HTML');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('✅ Dark class removed from HTML');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

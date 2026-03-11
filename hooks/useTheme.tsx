import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export interface ColorScheme {
  bg: string;
  surface: string;
  active: string;
  inactive: string;
  tabBackground: string;
  tabTopBorder: string;
  gradients: {
    background: [string, string];
  };
}

const lightColors: ColorScheme = {
  bg: "white",
  surface: "white",
  active: "#ffffff",
  inactive: "#bdd3f6",
  tabBackground: "#256ee4",
  tabTopBorder: "#0000001A",
  gradients: {
    background: ["black", "black"],
  },
};

const darkColors: ColorScheme = {
  bg: "#0f172a",
  surface: "#1e293b",
  active: "#3b82f6",
  inactive: "#64748b",
  tabBackground: "#0f172a",
  tabTopBorder: "#ffffff1A",
  gradients: {
    background: ["#0f172a", "#020617"],
  },
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: ColorScheme;
}

const ThemeContext = createContext<undefined | ThemeContextType>(undefined);
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // get the user's choice
    AsyncStorage.getItem("darkMode").then((value) => {
      if (value) setIsDarkMode(JSON.parse(value));
    });
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem("darkMode", JSON.stringify(newMode));
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
export default useTheme;

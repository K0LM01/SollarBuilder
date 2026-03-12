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
  textMuted: string;
  active: string;
  inactive: string;
  primary: string;
  tabBackground: string;
  tabTopBorder: string;
  headerBorderBottom: string;
  text: string;
  iconColor: string;
  gradients: {
    background: [string, string];
    primary: [string, string];
    surface: [string, string];
    empty: [string, string];
  };
}

const lightColors: ColorScheme = {
  bg: "white",
  surface: "white",
  active: "#ffffff",
  inactive: "#bdd3f6",
  tabBackground: "#256ee4",
  tabTopBorder: "#0000001A",
  primary: "#e2e8f0",
  text: "#1e293b",
  headerBorderBottom: "#d9d9d9",
  textMuted: "#64748b",
  iconColor: "#000000",
  gradients: {
    background: ["#ffffff", "#e8f0fe"],
    primary: ["#f8fafc", "#ffffff"],
    surface: ["#ffffff", "#f8fafc"],
    empty: ["#f3f4f6", "#e5e7eb"],
  },
};

const darkColors: ColorScheme = {
  bg: "#0f172a",
  surface: "#1e293b",
  active: "#3b82f6",
  inactive: "#64748b",
  iconColor: "#ffffff",
  headerBorderBottom: "#0f1a4b",
  text: "#f1f5f9",
  primary: "#60a5fa",
  tabBackground: "#0f172a",
  tabTopBorder: "#ffffff1A",
  textMuted: "#94a3b8",

  gradients: {
    background: ["#0f172a", "#040914"],
    primary: ["#0b1222", "#0f172a"],
    surface: ["#1e293b", "#334155"],
    empty: ["#374151", "#4b5563"],
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

import useTheme from "@/hooks/useTheme";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";

const TabsLayout = () => {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 14, // Menší font zaručí, že se text vždy vleze pod ikonku
          fontWeight: "600",
        },
        tabBarStyle: {
          backgroundColor: colors.tabBackground,
          borderTopWidth: 0, // Vypneme čáru

          // Vyřeší překrývání se systémovými tlačítky Androidu
          paddingBottom: 10,
          paddingTop: 10,
          minHeight: 90, // Použijeme minHeight místo fixní výšky

          // Jemný stín na okraj, místo tvrdé čáry
          elevation: 10, // Android stín
          shadowColor: "#000000", // iOS stín
          shadowOffset: {
            width: 0,
            height: -4, // Mínus vytvoří stín směrem nahoru (nad tab)
          },
          shadowOpacity: 0.1,
          shadowRadius: 5,
        },
      }}
    >
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="history" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "SolarPlanner",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="plus-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;

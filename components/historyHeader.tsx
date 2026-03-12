import { createHistoryStyles } from "@/assets/images/history.styles";
import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

const historyHeader = () => {
  const { colors } = useTheme();
  const historyStyles = createHistoryStyles(colors);
  const solarHistory = useQuery(api.solars.getSolars);

  const totalCount = solarHistory ? solarHistory.length : 0;

  return (
    <View style={historyStyles.header}>
      <View style={historyStyles.titleContainer}>
        <LinearGradient
          colors={colors.gradients.primary}
          style={historyStyles.iconContainer}
        >
          <FontAwesome5 name="solar-panel" size={28} color={colors.iconColor} />
        </LinearGradient>
        <View style={historyStyles.titleTextContainer}>
          <Text style={historyStyles.title}>Solar History</Text>
          <Text style={historyStyles.subtitle}>Total {totalCount} roofs</Text>
        </View>
      </View>
    </View>
  );
};

export default historyHeader;

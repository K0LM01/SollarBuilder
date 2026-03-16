import { createHistoryStyles } from "@/assets/images/history.styles";
import useTheme from "@/hooks/useTheme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

const indexHeader = () => {
  const { colors } = useTheme();
  const homeStyles = createHistoryStyles(colors);

  return (
    <View style={homeStyles.header}>
      <View style={homeStyles.titleContainer}>
        <LinearGradient
          colors={colors.gradients.primary}
          style={homeStyles.iconContainer}
        >
          <FontAwesome5 name="solar-panel" size={28} color={colors.iconColor} />
        </LinearGradient>
        <View style={homeStyles.titleTextContainer}>
          <Text style={homeStyles.title}>Add Solar</Text>
        </View>
      </View>
    </View>
  );
};

export default indexHeader;

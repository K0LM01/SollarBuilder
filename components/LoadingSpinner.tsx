import { createHistoryStyles } from "@/assets/images/history.styles";
import useTheme from "@/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Text, View } from "react-native";

const LoadingSpinner = () => {
  const { colors } = useTheme();

  const historyStyles = createHistoryStyles(colors);

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={historyStyles.container}
    >
      <View style={historyStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={historyStyles.loadingText}>Loading your solars...</Text>
      </View>
    </LinearGradient>
  );
};

export default LoadingSpinner;

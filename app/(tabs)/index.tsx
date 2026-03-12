import { createHomeStyles } from "@/assets/images/home.styles";
import useTheme from "@/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";

export default function Index() {
  const { colors } = useTheme();

  const homeStyles = createHomeStyles(colors);

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={homeStyles.container}
    ></LinearGradient>
  );
}

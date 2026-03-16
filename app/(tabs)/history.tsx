import { createHistoryStyles } from "@/assets/images/history.styles";
import EmptyState from "@/components/EmptyState";
import HistoryHeader from "@/components/historyHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import useTheme from "@/hooks/useTheme";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router"; // PŘIDÁNO
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Roof = Doc<"roofs">;
export default function HistoryScreen() {
  const { colors } = useTheme();
  const historyStyles = createHistoryStyles(colors);

  const router = useRouter(); // PŘIDÁNO - inicializace routeru

  const roofs = useQuery(api.solars.getSolars);
  const isLoading = roofs === undefined;

  if (isLoading) return <LoadingSpinner />;

  // ÚPRAVA: Přidáme parametr item typu Roof místo pouhého id
  const handleToggleRoof = (item: Roof) => {
    try {
      console.log("Otevírám plánek pro:", item.name);

      // Přesměrování na plánek se stejnými daty jako z Indexu
      router.push({
        pathname: "/roof-plan",
        params: {
          id: item._id,
          name: item.name,
          width: item.roofWidth,
          height: item.roofHeight,
        },
      });
    } catch (error) {
      console.log("Error, something went wrong", error);
      Alert.alert("Error", "Failed to open roof plan");
    }
  };

  const renderRoofItem = ({ item }: { item: Roof }) => {
    return (
      <View style={historyStyles.roofItemWrapper}>
        <TouchableOpacity
          activeOpacity={0.7}
          // ÚPRAVA: Tady předáme celý item do naší funkce
          onPress={() => handleToggleRoof(item)}
        >
          <LinearGradient
            colors={colors.gradients.surface}
            style={historyStyles.roofItem}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={historyStyles.roofTextContainer}>
              <Text style={historyStyles.itemName}>{item.name}</Text>

              <View style={historyStyles.dimensionsRow}>
                <Text style={historyStyles.dimensionLabel}>
                  Height:{" "}
                  <Text style={historyStyles.dimensionValue}>
                    {item.roofHeight}
                  </Text>
                </Text>

                <Text style={historyStyles.dimensionLabel}>
                  Width:{" "}
                  <Text style={historyStyles.dimensionValue}>
                    {item.roofWidth}
                  </Text>
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={historyStyles.container}
    >
      <SafeAreaView style={historyStyles.safeArea}>
        <HistoryHeader />

        <FlatList
          data={roofs ?? []}
          renderItem={renderRoofItem}
          keyExtractor={(item) => item._id}
          style={historyStyles.roofList}
          contentContainerStyle={historyStyles.roofListContent}
          ListEmptyComponent={<EmptyState />}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

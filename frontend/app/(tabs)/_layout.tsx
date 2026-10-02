import { Tabs } from "expo-router";
import FeatherIcon from "@react-native-vector-icons/feather";
import { colors } from "@/src/theme";
import { Platform, View } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: colors.surface }} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <FeatherIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="sections"
        options={{
          title: "Sezioni",
          tabBarIcon: ({ color, size }) => (
            <FeatherIcon name="grid" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Movimenti",
          tabBarIcon: ({ color, size }) => (
            <FeatherIcon name="list" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analisi",
          tabBarIcon: ({ color, size }) => (
            <FeatherIcon name="pie-chart" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

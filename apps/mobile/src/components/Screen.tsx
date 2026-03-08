import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mobileTheme } from "@/src/theme";

type ScreenProps = {
  title: string;
  description: string;
};

export default function Screen({ title, description }: ScreenProps) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: mobileTheme.colors.dark.bg }}
      className="flex-1 px-5 py-6"
    >
      <View
        className="rounded-2xl border p-5"
        style={{
          borderColor: mobileTheme.colors.dark.border,
          backgroundColor: mobileTheme.colors.dark.surface,
        }}
      >
        <Text className="text-2xl font-semibold text-white">{title}</Text>
        <Text className="mt-3 text-sm leading-6 text-slate-300">{description}</Text>
      </View>
    </SafeAreaView>
  );
}

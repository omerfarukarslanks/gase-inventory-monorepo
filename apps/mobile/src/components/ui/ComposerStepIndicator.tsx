import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { mobileTheme } from "@/src/theme";

export type StepStatus = "completed" | "active" | "locked" | "error";

export type ComposerStep<T extends string> = {
  value: T;
  label: string;
  status: StepStatus;
};

type ComposerStepIndicatorProps<T extends string> = {
  steps: ComposerStep<T>[];
  onChange?: (value: T) => void;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 6,
  },
  step: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  stepCompleted: {
    borderColor: mobileTheme.colors.brand.primary,
    backgroundColor: `${mobileTheme.colors.brand.primary}18`,
  },
  stepActive: {
    borderColor: mobileTheme.colors.brand.primary,
    backgroundColor: `${mobileTheme.colors.brand.primary}10`,
  },
  stepLocked: {
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface,
  },
  stepError: {
    borderColor: mobileTheme.colors.brand.error,
    backgroundColor: `${mobileTheme.colors.brand.error}10`,
  },
  stepPressed: {
    opacity: 0.72,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  labelCompleted: { color: mobileTheme.colors.brand.primary },
  labelActive: { color: mobileTheme.colors.brand.primary },
  labelLocked: { color: mobileTheme.colors.dark.text2 },
  labelError: { color: mobileTheme.colors.brand.error },
});

const statusIcon: Record<StepStatus, keyof typeof MaterialCommunityIcons.glyphMap | null> = {
  completed: "check-circle",
  active: null,
  locked: "lock-outline",
  error: "alert-circle-outline",
};

const statusStyles: Record<StepStatus, { step: object; label: object }> = {
  completed: { step: styles.stepCompleted, label: styles.labelCompleted },
  active: { step: styles.stepActive, label: styles.labelActive },
  locked: { step: styles.stepLocked, label: styles.labelLocked },
  error: { step: styles.stepError, label: styles.labelError },
};

const iconColor: Record<StepStatus, string> = {
  completed: mobileTheme.colors.brand.primary,
  active: mobileTheme.colors.brand.primary,
  locked: mobileTheme.colors.dark.text2,
  error: mobileTheme.colors.brand.error,
};

export function ComposerStepIndicator<T extends string>({
  steps,
  onChange,
}: ComposerStepIndicatorProps<T>) {
  return (
    <View style={styles.container}>
      {steps.map((step) => {
        const { step: stepStyle, label: labelStyle } = statusStyles[step.status];
        const icon = statusIcon[step.status];
        const canTap = onChange && step.status !== "locked";

        return (
          <Pressable
            key={step.value}
            onPress={canTap ? () => onChange(step.value) : undefined}
            style={({ pressed }) => [styles.step, stepStyle, pressed && canTap && styles.stepPressed]}
            accessibilityRole="tab"
            accessibilityLabel={step.label}
            accessibilityState={{ selected: step.status === "active" }}
          >
            {icon ? (
              <MaterialCommunityIcons name={icon} size={16} color={iconColor[step.status]} />
            ) : (
              <View style={{ height: 16 }} />
            )}
            <Text style={[styles.label, labelStyle]}>{step.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

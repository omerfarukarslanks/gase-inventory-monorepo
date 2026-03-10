import { ScrollView, Text, View } from "react-native";
import {
  Banner,
  BarList,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  ListRow,
  MetricCard,
  ScreenHeader,
  SectionTitle,
  SkeletonBlock,
} from "@/src/components/ui";
import { type DetailState, type ReportDetailKey, type ReportsRange, rangeOptions } from "../types";
import { reportStyles as styles } from "../styles";

type Props = {
  detailKey: ReportDetailKey;
  detailState: DetailState;
  range: ReportsRange;
  setRange: (v: ReportsRange) => void;
  rangeLabel: string;
  storeScopeLabel: string;
  onBack: () => void;
  onRefresh: () => void;
};

export function ReportDetailView({
  detailKey,
  detailState,
  range,
  setRange,
  rangeLabel,
  storeScopeLabel,
  onBack,
  onRefresh,
}: Props) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title={detailState.model?.title ?? "Rapor detayi"}
          subtitle={detailState.model?.subtitle ?? "Detay verisi yukleniyor"}
          onBack={onBack}
          action={
            <Button
              label="Yenile"
              onPress={onRefresh}
              variant="secondary"
              size="sm"
              fullWidth={false}
            />
          }
        />

        {detailState.error ? <Banner text={detailState.error} /> : null}

        <Card>
          <SectionTitle title="Rapor kapsami" />
          <View style={styles.scopeBlock}>
            <FilterTabs value={range} options={rangeOptions} onChange={setRange} />
            <View style={styles.scopeStats}>
              <View style={styles.scopeStat}>
                <Text style={styles.scopeLabel}>Donem</Text>
                <Text style={styles.scopeValue}>{rangeLabel}</Text>
              </View>
              <View style={styles.scopeStat}>
                <Text style={styles.scopeLabel}>Scope</Text>
                <Text style={styles.scopeValue}>{storeScopeLabel}</Text>
              </View>
            </View>
          </View>
        </Card>

        {detailState.loading ? (
          <>
            <View style={styles.metricGrid}>
              {Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={styles.metricItem}>
                  <Card style={styles.metricSkeletonCard}>
                    <SkeletonBlock width="45%" />
                    <SkeletonBlock height={28} width="65%" style={styles.skeletonGap} />
                    <SkeletonBlock width="55%" />
                  </Card>
                </View>
              ))}
            </View>
            <Card>
              <SkeletonBlock height={18} width="35%" />
              <View style={styles.loadingList}>
                <SkeletonBlock height={72} />
                <SkeletonBlock height={72} />
              </View>
            </Card>
          </>
        ) : detailState.model ? (
          <>
            {detailState.model.metrics.length ? (
              <View style={styles.metricGrid}>
                {detailState.model.metrics.map((metric) => (
                  <View key={metric.key} style={styles.metricItem}>
                    <MetricCard label={metric.label} value={metric.value} hint={metric.hint} />
                  </View>
                ))}
              </View>
            ) : null}

            {detailState.model.sections.map((section) => {
              if (section.type === "stats") {
                return (
                  <Card key={section.title}>
                    <SectionTitle title={section.title} />
                    <View style={styles.detailStats}>
                      {section.items.map((item) => (
                        <View key={item.label} style={styles.scopeStat}>
                          <Text style={styles.scopeLabel}>{item.label}</Text>
                          <Text style={styles.scopeValue}>{item.value}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                );
              }

              if (section.type === "bars") {
                return (
                  <Card key={section.title}>
                    <SectionTitle title={section.title} />
                    {section.items.length ? (
                      <BarList items={section.items} formatter={section.formatter} />
                    ) : (
                      <EmptyStateWithAction
                        title="Bar veri bulunamadi."
                        subtitle="Secili kapsam icin ozet dagilim kaydi yok."
                        actionLabel="Yenile"
                        onAction={onRefresh}
                      />
                    )}
                  </Card>
                );
              }

              return (
                <Card key={section.title}>
                  <SectionTitle title={section.title} />
                  {section.items.length ? (
                    <View style={styles.list}>
                      {section.items.map((item) => (
                        <ListRow
                          key={item.key}
                          title={item.title}
                          subtitle={item.subtitle}
                          caption={item.caption}
                          badgeLabel={item.badgeLabel}
                          badgeTone={item.badgeTone ?? "neutral"}
                        />
                      ))}
                    </View>
                  ) : (
                    <EmptyStateWithAction
                      title={section.emptyTitle}
                      subtitle={section.emptySubtitle}
                      actionLabel="Yenile"
                      onAction={onRefresh}
                    />
                  )}
                </Card>
              );
            })}

            {detailState.model.note ? (
              <Card>
                <SectionTitle title="Operator notu" />
                <Text style={styles.noteText}>{detailState.model.note}</Text>
              </Card>
            ) : null}
          </>
        ) : (
          <EmptyStateWithAction
            title="Rapor detayi yuklenemedi."
            subtitle="Bu raporu yeniden acmayi dene."
            actionLabel="Geri don"
            onAction={onBack}
          />
        )}
      </ScrollView>
    </View>
  );
}

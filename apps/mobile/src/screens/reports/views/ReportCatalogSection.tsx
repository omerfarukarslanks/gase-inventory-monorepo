import { Text, View } from "react-native";
import { Card, ListRow, SectionTitle } from "@/src/components/ui";
import { type CatalogItem, type ReportDetailKey } from "../types";
import { reportStyles as styles } from "../styles";

type CatalogGroup = {
  title: string;
  items: CatalogItem[];
};

type Props = {
  catalog: CatalogGroup[];
  onSelect: (key: ReportDetailKey) => void;
};

export function ReportCatalogSection({ catalog, onSelect }: Props) {
  return (
    <>
      {catalog.map((group) => (
        <Card key={group.title}>
          <SectionTitle title={group.title} />
          <View style={styles.catalogList}>
            {group.items.map((item) => (
              <ListRow
                key={item.key}
                title={item.title}
                subtitle={item.description}
                caption="Detay raporu ac"
                onPress={() => onSelect(item.key)}
                icon={
                  <View style={styles.catalogIcon}>
                    <Text style={styles.catalogIconText}>
                      {item.title.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                }
              />
            ))}
          </View>
        </Card>
      ))}
    </>
  );
}

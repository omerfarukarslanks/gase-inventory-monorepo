import { locales } from "@gase/i18n";

// Web-specific extensions on top of the shared base.
// Add web-only keys here; shared keys are inherited from @gase/i18n.
const tr = {
  ...locales.tr,
  shell: {
    activeStore: "Aktif Magaza",
    noActiveStore: "Magaza baglami yok",
    navigationMenu: "Navigasyon menusu",
    more: "Menu",
    menuTitle: "Menu",
    quickPreferences: "Hizli tercihler",
    filtersTitle: "Filtreler",
  },
};

export default tr;

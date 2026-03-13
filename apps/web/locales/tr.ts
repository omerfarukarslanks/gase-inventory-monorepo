import { locales } from "@gase/i18n";

// Web-specific extensions on top of the shared base.
// Add web-only keys here; shared keys are inherited from @gase/i18n.
const tr = {
  ...locales.tr,
  nav: {
    ...locales.tr.nav,
    supply: "Tedarik",
    supplySuggestions: "Oneriler",
    purchaseOrders: "Satin Alma Siparisleri",
    catalog: "Katalog",
    settings: "Ayarlar",
  },
  shell: {
    activeStore: "Aktif Magaza",
    noActiveStore: "Magaza baglami yok",
    navigationMenu: "Navigasyon menusu",
    breadcrumbsLabel: "Sayfa yolu",
    more: "Menu",
    menuTitle: "Menu",
    quickPreferences: "Hizli tercihler",
    filtersTitle: "Filtreler",
    sectionsTitle: "Bolumler",
    switchSection: "Bolum Sec",
    expandGroup: "Grubu ac",
    collapseGroup: "Grubu kapat",
    noModuleAccess: "Bu modül için erişiminiz yok.",
  },
};

export default tr;

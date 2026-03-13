import { locales } from "@gase/i18n";

const de = {
  ...locales.de,
  nav: {
    ...locales.de.nav,
    supply: "Beschaffung",
    supplySuggestions: "Vorschlage",
    purchaseOrders: "Bestellungen",
    approvals: "Freigaben",
    pendingApprovals: "Ausstehend",
    approvalHistory: "Verlauf",
    catalog: "Katalog",
    settings: "Einstellungen",
  },
  shell: {
    activeStore: "Aktiver Store",
    noActiveStore: "Kein Store-Kontext",
    navigationMenu: "Navigationsmenü",
    breadcrumbsLabel: "Navigationspfad",
    more: "Menü",
    menuTitle: "Menü",
    quickPreferences: "Schnelleinstellungen",
    filtersTitle: "Filter",
    sectionsTitle: "Bereiche",
    switchSection: "Bereich wechseln",
    expandGroup: "Gruppe aufklappen",
    collapseGroup: "Gruppe einklappen",
    noModuleAccess: "Sie haben keinen Zugriff auf dieses Modul.",
  },
};

export default de;

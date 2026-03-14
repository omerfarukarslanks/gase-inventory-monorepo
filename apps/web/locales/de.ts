import { locales } from "@gase/i18n";
import en from "./en";

const de = {
  ...locales.de,
  common: {
    ...locales.de.common,
    delete: "Löschen",
  },
  nav: {
    ...locales.de.nav,
    supply: "Beschaffung",
    salesList: "Verkaufe",
    salesReturns: "Retouren",
    supplySuggestions: "Vorschlage",
    purchaseOrders: "Bestellungen",
    receipts: "Wareneingange",
    supplyRules: "Regeln",
    warehouse: "Lager",
    countSessions: "Inventursitzungen",
    warehouses: "Lagerhauser",
    locations: "Lagerplatze",
    putawayTasks: "Einlagerungsaufgaben",
    pickingTasks: "Kommissionieraufgaben",
    waves: "Waves",
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
  salesReturns: en.salesReturns,
  supply: en.supply,
  warehouse: en.warehouse,
};

export default de;

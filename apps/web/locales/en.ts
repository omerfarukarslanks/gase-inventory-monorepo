import { locales } from "@gase/i18n";

const en = {
  ...locales.en,
  nav: {
    ...locales.en.nav,
    supply: "Supply",
    supplySuggestions: "Suggestions",
    purchaseOrders: "Purchase Orders",
    approvals: "Approvals",
    pendingApprovals: "Pending",
    approvalHistory: "History",
    catalog: "Catalog",
    settings: "Settings",
  },
  shell: {
    activeStore: "Active Store",
    noActiveStore: "No store context",
    navigationMenu: "Navigation menu",
    breadcrumbsLabel: "Breadcrumbs",
    more: "Menu",
    menuTitle: "Menu",
    quickPreferences: "Quick preferences",
    filtersTitle: "Filters",
    sectionsTitle: "Sections",
    switchSection: "Switch Section",
    expandGroup: "Expand group",
    collapseGroup: "Collapse group",
    noModuleAccess: "You do not have access to this module.",
  },
};

export default en;

import { locales } from "@gase/i18n";
import en from "./en";

const ar = {
  ...locales.ar,
  common: {
    ...locales.ar.common,
    delete: "حذف",
  },
  nav: {
    ...locales.ar.nav,
    supply: "التوريد",
    supplySuggestions: "الاقتراحات",
    purchaseOrders: "اوامر الشراء",
    receipts: "استلام البضائع",
    supplyRules: "قواعد التوريد",
    warehouse: "المستودع",
    countSessions: "جلسات الجرد",
    warehouses: "المستودعات",
    locations: "المواقع",
    putawayTasks: "مهام التخزين",
    pickingTasks: "مهام الالتقاط",
    waves: "الموجات",
    approvals: "الموافقات",
    pendingApprovals: "قيد الانتظار",
    approvalHistory: "السجل",
    catalog: "الكتالوج",
    settings: "الإعدادات",
  },
  shell: {
    activeStore: "المتجر النشط",
    noActiveStore: "لا يوجد سياق متجر",
    navigationMenu: "قائمة التنقل",
    breadcrumbsLabel: "مسار التنقل",
    more: "القائمة",
    menuTitle: "القائمة",
    quickPreferences: "تفضيلات سريعة",
    filtersTitle: "الفلاتر",
    sectionsTitle: "الأقسام",
    switchSection: "تبديل القسم",
    expandGroup: "توسيع المجموعة",
    collapseGroup: "طي المجموعة",
    noModuleAccess: "ليس لديك صلاحية الوصول إلى هذه الوحدة.",
  },
  supply: en.supply,
  warehouse: en.warehouse,
};

export default ar;

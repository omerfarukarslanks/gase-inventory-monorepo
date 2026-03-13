import { locales } from "@gase/i18n";
import en from "./en";

const es = {
  ...locales.es,
  common: {
    ...locales.es.common,
    delete: "Eliminar",
  },
  nav: {
    ...locales.es.nav,
    supply: "Abastecimiento",
    supplySuggestions: "Sugerencias",
    purchaseOrders: "Ordenes de compra",
    warehouse: "Almacen",
    countSessions: "Sesiones de conteo",
    warehouses: "Almacenes",
    locations: "Ubicaciones",
    approvals: "Aprobaciones",
    pendingApprovals: "Pendientes",
    approvalHistory: "Historial",
    catalog: "Catalogo",
    settings: "Configuracion",
  },
  shell: {
    activeStore: "Tienda activa",
    noActiveStore: "Sin contexto de tienda",
    navigationMenu: "Menú de navegación",
    breadcrumbsLabel: "Ruta de navegación",
    more: "Menú",
    menuTitle: "Menú",
    quickPreferences: "Preferencias rápidas",
    filtersTitle: "Filtros",
    sectionsTitle: "Secciones",
    switchSection: "Cambiar seccion",
    expandGroup: "Expandir grupo",
    collapseGroup: "Contraer grupo",
    noModuleAccess: "No tienes acceso a este modulo.",
  },
  warehouse: en.warehouse,
};

export default es;

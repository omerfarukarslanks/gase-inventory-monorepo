import { locales } from "@gase/i18n";

const es = {
  ...locales.es,
  nav: {
    ...locales.es.nav,
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
};

export default es;

# History

Ниже зафиксирована последовательность формирования проекта.

1. Создан Angular workspace (CLI) и базовые конфигурации корня (`angular.json`, `tsconfig.json`, `package.json`).
2. Сгенерировано приложение `projects/app-client` и библиотека `projects/product-hierarchy-viewer`.
3. В библиотеке описаны интерфейсы моделей (`HierarchyNode`, `ViewerConfig`, `NodeUpdate`).
4. В ядре выделены интерфейсы layout/render/interaction и оркестратор `HierarchyViewerCore`.
5. Добавлен D3-адаптер (`d3-hierarchy-viewer.ts`) с простым layout, SVG-рендером и pan/zoom.
6. Создан Angular-компонент `ProductHierarchyViewerComponent` и сервис фабрики.
7. В `app-client` добавлен `FeatureHierarchyModule`, страница `HierarchyPageComponent` и моковые данные.
8. Оформлена документация и базовая инструкция запуска.
9. Обновлены версии зависимостей до Angular 18, D3 удален, адаптер переведен на SVG/DOM-рендер и нативный pan/zoom.
10. Обновлен UI приложения: новая шапка, виджет метрик, легенда статусов и обновленная панель деталей.

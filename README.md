# MMZ Diploma - Product Hierarchy Viewer

Монорепозиторий для дипломного проекта: Angular-приложение (MVP) и библиотека визуализации иерархии изделий промышленного предприятия.

## Структура репозитория

- `projects/app-client/` - клиентское Angular-приложение (страница визуализации).
- `projects/product-hierarchy-viewer/` - Angular-библиотека визуализатора (npm-пакет).
- `angular.json`, `tsconfig.json`, `package.json` - конфигурации Angular workspace.
- `history.md` - последовательность этапов и история сборки проекта.

## Используемые библиотеки и версии (точно, по `package-lock.json`)

Ниже перечислены **фактические** установленные версии, которые нужно отправить по почте:

- `@angular/animations`: `18.2.13`
- `@angular/cdk`: `18.2.14`
- `@angular/common`: `18.2.13`
- `@angular/compiler`: `18.2.13`
- `@angular/core`: `18.2.13`
- `@angular/forms`: `18.2.13`
- `@angular/material`: `18.2.14`
- `@angular/platform-browser`: `18.2.13`
- `@angular/platform-browser-dynamic`: `18.2.13`
- `@angular/router`: `18.2.13`
- `rxjs`: `7.8.1`
- `tslib`: `2.8.1`
- `zone.js`: `0.14.10`
- `@angular-devkit/build-angular`: `18.2.14`
- `@angular/cli`: `18.2.14`
- `@angular/compiler-cli`: `18.2.13`
- `typescript`: `5.4.5`
- `@types/jasmine`: `5.1.6`
- `jasmine-core`: `5.1.2`
- `karma`: `6.4.4`
- `karma-chrome-launcher`: `3.2.0`
- `karma-coverage`: `2.2.1`
- `karma-jasmine`: `5.1.0`
- `karma-jasmine-html-reporter`: `2.1.0`

Источник истины для актуальных версий: `package-lock.json`.

## Что может пригодиться дальше (не установлено, список для планирования)

Возможные зависимости для следующих этапов дипломного проекта:

- `@ngrx/store` + `@ngrx/effects` - управление состоянием и side-effects при усложнении логики.
- `@ngneat/until-destroy` или собственный хелпер - безопасное управление подписками.
- `date-fns` - форматирование дат и дедлайнов в карточке узла.
- `zod` или `io-ts` - валидация входных данных дерева.
- `cypress` или `playwright` - e2e-тесты для UI и визуализации.

## Быстрый старт (WSL/Ubuntu)

```bash
npm install
npm run start
```

Приложение поднимется на `http://localhost:4200`.

## Сборка библиотеки

```bash
npm run ng -- build product-hierarchy-viewer
```

## Использование библиотеки

Минимальный пример подключения:

```ts
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ProductHierarchyViewerModule } from 'product-hierarchy-viewer';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, ProductHierarchyViewerModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

```html
<!-- component template -->
<product-hierarchy-viewer
  [data]="nodes"
  [config]="viewerConfig"
  (nodeSelected)="onNodeSelected($event)"
  (nodeToggled)="onNodeToggled($event)"
  (nodeUpdated)="onNodeUpdated($event)"
></product-hierarchy-viewer>
```

```ts
import { HierarchyNode, ViewerConfig } from 'product-hierarchy-viewer';

nodes: HierarchyNode[] = [...];
viewerConfig: ViewerConfig = {
  initialDepth: 2,
  enableAnimations: true,
  enablePanZoom: true,
};
```

## Архитектура библиотеки

- `src/lib/models/` - базовые интерфейсы (данные и конфиг).
- `src/lib/core/` - ядро визуализатора:
  - `layout/` - расчет координат дерева.
- `render/` - рендеринг SVG (через SVG-адаптер).
- `interaction/` - события, pan/zoom, раскрытие.
- `d3-hierarchy-viewer.ts` - SVG-адаптер (layout + render + interaction).
- `src/lib/services/` - Angular-обертка для создания ядра.
- `ProductHierarchyViewerComponent` - публичный компонент библиотеки.

## MVP в приложении

Страница `HierarchyPageComponent` показывает:
- дерево изделий с раскрытием/сворачиванием (double click по узлу),
- pan/zoom (колесо + drag),
- выбор узла (click),
- панель деталей выбранного узла справа,
- `nodeUpdated` пока вызывается контекстным кликом как заглушка для будущего редактирования.

## Этапы проекта (кратко)

1. Инициализация Angular workspace и генерация приложения/библиотеки.
2. Описание моделей данных и конфигураций визуализатора.
3. Разделение ядра на layout/render/interaction интерфейсы.
4. SVG-адаптер для расчетов, SVG-отрисовки и pan/zoom.
5. Angular-обертка компонента и сервис для создания ядра.
6. MVP-страница в `app-client` + моковые данные.
7. Документация и подготовка точек расширения.

Подробная последовательность - в `history.md`.

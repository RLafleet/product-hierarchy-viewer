import { HierarchyNode } from 'product-hierarchy-viewer';

export const MOCK_HIERARCHY: HierarchyNode[] = [
  {
    id: 'node-1',
    parentId: null,
    name: 'Сборочный участок',
    type: 'area',
    status: 'active',
    deadline: '2025-06-01',
    meta: {
      plannedFinish: '2025-06-10',
      responsible: 'Ирина Смирнова',
      batch: 'Партия 17',
      line: 'Сборочная линия A'
    },
    children: [
      {
        id: 'node-1-1',
        parentId: 'node-1',
        name: 'Изделие А-100',
        type: 'product',
        status: 'in-progress',
        deadline: '2025-05-10',
        meta: {
          plannedFinish: '2025-05-18',
          responsible: 'Дмитрий Павлов',
          batch: 'A-100/05',
          line: 'Линия A'
        },
        children: [
          {
            id: 'node-1-1-1',
            parentId: 'node-1-1',
            name: 'Узел А-110',
            type: 'assembly',
            status: 'blocked',
            deadline: '2025-04-18',
            meta: {
              plannedFinish: '2025-04-25',
              responsible: 'Алексей Котов',
              batch: 'A-110/03',
              line: 'Поток 3'
            },
            children: [
              {
                id: 'node-1-1-1-1',
                parentId: 'node-1-1-1',
                name: 'Деталь А-111',
                type: 'part',
                status: 'waiting',
                deadline: '2025-04-05',
                meta: {
                  plannedFinish: '2025-04-07',
                  responsible: 'Мария Волкова',
                  batch: 'A-111/01',
                  line: 'Токарный пост 2'
                },
                isLeaf: true
              }
            ]
          },
          {
            id: 'node-1-1-2',
            parentId: 'node-1-1',
            name: 'Узел А-120',
            type: 'assembly',
            status: 'active',
            deadline: '2025-04-25',
            meta: {
              plannedFinish: '2025-04-30',
              responsible: 'Олег Данилов',
              batch: 'A-120/02',
              line: 'Поток 4'
            },
            children: [
              {
                id: 'node-1-1-2-1',
                parentId: 'node-1-1-2',
                name: 'Деталь А-121',
                type: 'part',
                status: 'done',
                deadline: '2025-04-01',
                meta: {
                  plannedFinish: '2025-03-28',
                  responsible: 'Анна Егорова',
                  batch: 'A-121/05',
                  line: 'Фрезерный пост 1'
                },
                isLeaf: true
              }
            ]
          }
        ]
      },
      {
        id: 'node-1-2',
        parentId: 'node-1',
        name: 'Изделие B-200',
        type: 'product',
        status: 'review',
        deadline: '2025-06-20',
        meta: {
          plannedFinish: '2025-06-28',
          responsible: 'Сергей Шатов',
          batch: 'B-200/07',
          line: 'Линия B'
        },
        children: [
          {
            id: 'node-1-2-1',
            parentId: 'node-1-2',
            name: 'Узел B-210',
            type: 'assembly',
            status: 'in-progress',
            deadline: '2025-05-15',
            meta: {
              plannedFinish: '2025-05-22',
              responsible: 'Владимир Корнилов',
              batch: 'B-210/01',
              line: 'Поток 2'
            },
            isLeaf: true
          }
        ]
      }
    ]
  },
  {
    id: 'node-2',
    parentId: null,
    name: 'Сервисный участок',
    type: 'area',
    status: 'active',
    deadline: '2025-07-05',
    meta: {
      plannedFinish: '2025-07-14',
      responsible: 'Екатерина Орлова',
      batch: 'Сервис-07',
      line: 'Сервисная линия'
    },
    children: [
      {
        id: 'node-2-1',
        parentId: 'node-2',
        name: 'Платформа обслуживания',
        type: 'platform',
        status: 'active',
        deadline: '2025-06-15',
        meta: {
          plannedFinish: '2025-06-18',
          responsible: 'Максим Прудников',
          batch: 'PLT-15',
          line: 'Сервисная линия'
        },
        isLeaf: true
      }
    ]
  }
];

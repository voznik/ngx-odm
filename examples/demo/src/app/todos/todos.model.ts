export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  last_modified: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _attachments?: Record<string, any>;
}

export type TodosFilter = 'ALL' | 'COMPLETED' | 'ACTIVE';

export interface TodosLocalState {
  filter: TodosFilter;
}

export const TODOS_INITIAL_ITEMS = [
  {
    id: 'ac3ef2c6-c98b-43e1-9047-71d68b1f92f4',
    title: 'Open Todo list example',
    completed: true,
    createdAt: new Date(1546300800000).toISOString(),
    last_modified: 1546300800000,
  },
  {
    id: 'a4c6a479-7cca-4d3b-ab90-45d3eaa957f3',
    title: 'Check other examples',
    completed: false,
    createdAt: new Date(1548979200000).toISOString(),
    last_modified: 1548979200000,
  },
  {
    id: 'a4c6a479-7cca-4d3b-bc10-45d3eaa957r5',
    title: 'Use "@ngx-odm/rxdb" in your project',
    completed: false,
    createdAt: new Date().toISOString(),
    last_modified: Date.now(),
  },
];

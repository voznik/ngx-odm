export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  last_modified: number;
}

export type TodosFilter = 'ALL' | 'COMPLETED' | 'ACTIVE';

export interface TodosState {
  items: Todo[];
  filter: TodosFilter;
}

export const TODOS_INITIAL_STATE: TodosState = {
  items: [
    {
      id: 'ac3ef2c6-c98b-43e1-9047-71d68b1f92f4',
      title: 'Open Todo list example',
      completed: true,
      createdAt: 1546300800000,
      last_modified: 1546300800000,
    },
    {
      id: 'a4c6a479-7cca-4d3b-ab90-45d3eaa957f3',
      title: 'Check other examples',
      completed: false,
      createdAt: 1548979200000,
      last_modified: 1548979200000,
    },
    {
      id: 'a4c6a479-7cca-4d3b-bc10-45d3eaa957r5',
      title: 'Use "@ngx-odm/rxdb" in your project',
      completed: false,
      createdAt: Date.now(),
      last_modified: Date.now(),
    },
  ],
  filter: 'ALL',
};

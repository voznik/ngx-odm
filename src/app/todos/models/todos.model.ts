export interface Todo {
  guid: string;
  name: string;
  done: boolean;
  dateCreated: number;
}

export type TodosFilter = 'ALL' | 'DONE' | 'ACTIVE';

export interface TodosState {
  items: Todo[];
  filter: TodosFilter;
}

export const initialState: TodosState = {
  items: [
    {
      guid: 'ac3ef2c6-c98b-43e1-9047-71d68b1f92f4',
      name: 'Open Todo list example',
      done: true,
      dateCreated: 1546300800000,
    },
    {
      guid: 'a4c6a479-7cca-4d3b-ab90-45d3eaa957f3',
      name: 'Check the other examples',
      done: false,
      dateCreated: 1548979200000,
    },
    {
      guid: 'a4c6a479-7cca-4d3b-bc10-45d3eaa957r5',
      name: 'Use Angular ngRx Material Starter in your project',
      done: false,
      dateCreated: Date.now(),
    },
  ],
  filter: 'ALL',
};

import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import RxDBDataframe from './lib/RxDBDataframe';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  // <StrictMode>
    <RxDBDataframe />
  // </StrictMode>
);

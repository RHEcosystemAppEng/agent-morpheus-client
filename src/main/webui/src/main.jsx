import '../css/patternfly.css'
import '../css/patternfly-addons.css'

import ReactDOM from 'react-dom/client'
import App from './App'
import { RouterProvider, createHashRouter } from 'react-router-dom'
import Analysis from './Analysis'
import Reports from './Reports'

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Analysis/>,
        index: true
      },
      {
        path: "/reports",
        element: <Reports/>
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
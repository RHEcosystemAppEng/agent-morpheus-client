import '../css/patternfly.css'
import '../css/patternfly-addons.css'

import ReactDOM from 'react-dom/client'
import App from './App'
import { RouterProvider, createHashRouter } from 'react-router-dom'
import Analysis from './Analysis'
import ComponentAnalysis from './ComponentAnalysis'
import Reports from './Reports'
import Report from './Report'
import Vulnerabilities from './Vulnerabilities'
import Vulnerability from './Vulnerability'

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Analysis />,
        index: true
      },
      {
        path: "reports",
        element: <Reports />,
      },
      {
        path: "reports/:id",
        element: <Report />
      },
      {
        path: "vulnerabilities",
        element: <Vulnerabilities />,
      },
      {
        path: "vulnerabilities/:id",
        element: <Vulnerability />,
      },
      {
        path: "component_analysis/",
        element: <ComponentAnalysis />,
      },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
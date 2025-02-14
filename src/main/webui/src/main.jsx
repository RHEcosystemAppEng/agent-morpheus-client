import '@patternfly/patternfly/patternfly.css'
import '@patternfly/patternfly/patternfly-addons.css'

import ReactDOM from 'react-dom/client'
import App from './App'
import { RouterProvider, createHashRouter } from 'react-router-dom'
import Analysis from './Analysis'
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
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
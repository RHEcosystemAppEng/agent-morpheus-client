import { Avatar, Dropdown, DropdownItem, DropdownList, Masthead, MastheadMain, MastheadLogo, MastheadContent, MenuToggle, Nav, NavItem, NavList, Page, SkipToContent, Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem, MastheadToggle, MastheadBrand, PageToggleButton, PageSidebar, PageSidebarBody, Title } from '@patternfly/react-core';
import imgAvatar from '@patternfly/react-core/src/components/assets/avatarImg.svg';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ToastNotifications } from './components/Notifications';
import BarsIcon from '@patternfly/react-icons/dist/esm/icons/bars-icon';
import { getUserName, logoutUser } from './services/UserClient';

export default function App() {

  const [vulnRequest, setVulnRequest] = React.useState({ analysisType: 'image', sbomType: 'manual' });
  const [productVulnRequest, setProductVulnRequest] = React.useState({ analysisType: 'image', sbomType: 'manual' });
  const [sourceRequest, setSourceRequest] = React.useState({ analysisType: 'source' });
  const [alerts, setAlerts] = React.useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [userName, setUserName] = React.useState('');

  var loc = window.location, wss_uri;
  if (loc.protocol === "https:") {
    wss_uri = "wss:";
  } else {
    wss_uri = "ws:";
  }
  wss_uri += "//" + loc.host;
  wss_uri += "/notifications";

  React.useEffect(() => {
    const socket = new WebSocket(wss_uri);
    socket.addEventListener("open", (_) => {
      console.log("Notifications WebSocket Opened");
    });

    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      console.log(`Received new report: ${data}`);
      if(data.result === "Completed") {
        addAlert('Info', 'New report received', <p>Report: {data.name} reveived.<div><Link to={`/reports/${data.id}`} onClick={onLinkToReportClicked}>View</Link></div></p>)
      } else {
        addAlert('Error', 'Error received', <p>Error: {data.result}</p>);
      }
    });
    getUserName().then(userName => setUserName(userName));
  }, []);

  const onLinkToReportClicked = () => {
    onDeleteAlert(-1);
  }
  const addAlert = (variant, title, content) => {
    setAlerts(prevAlerts => [...prevAlerts, { title: title, variant: variant, content: content }]);
  }

  const onDeleteAlert = deletePos => {
    if (deletePos == -1) {
      setAlerts(prevAlerts => prevAlerts.slice(0, -1));
    }
    setAlerts(prevAlerts => prevAlerts.filter((_, idx) => idx !== deletePos));
  }

  const onSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleVulnRequestChange = (changes) => {
    let updated = { ...vulnRequest }
    Object.assign(updated, changes)
    setVulnRequest(updated);
    return updated;
  };

  const handleProductVulnRequestChange = (changes) => {
    let updated = { ...productVulnRequest }
    Object.assign(updated, changes)
    setProductVulnRequest(updated);
    return updated;
  };

  const handleSourceRequestChange = (changes) => {
    let updated = { ...sourceRequest }
    Object.assign(updated, changes)
    setSourceRequest(updated);
    return updated;
  };

  const handleLogout = () => {
    logoutUser();
  }

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const location = useLocation();

  const onDropdownToggle = () => setIsDropdownOpen(prevState => !prevState);
  const onDropdownSelect = () => setIsDropdownOpen(false);

  const PageNav = <Nav aria-label="Nav">
    <NavList>
      <NavItem itemId={0} isActive={location.pathname === '/'} to="#">
        Request Component Analysis
      </NavItem>
      <NavItem itemId={1} isActive={location.pathname.startsWith('/reports')} to="#/reports">
        View Reports
      </NavItem>
      <NavItem itemId={2} isActive={location.pathname.startsWith('/vulnerabilities')} to="#/vulnerabilities">
        Vulnerabilities
      </NavItem>
      <NavItem itemId={3} isActive={location.pathname === '/product'} to="#/product">
        Request Product Analysis
      </NavItem>
      <NavItem itemId={4} isActive={location.pathname.startsWith('/product-reports')} to="#/product-reports">
        Product Reports
      </NavItem>
    </NavList>
  </Nav>;

  const userDropdownItems = <>
    <DropdownItem key="group 2 logout" onClick={handleLogout}>Logout</DropdownItem>
  </>;
  const sidebar = <PageSidebar isSidebarOpen={isSidebarOpen} id='vertical-sidebar'>
    <PageSidebarBody>{PageNav}</PageSidebarBody>
  </PageSidebar>
  const headerToolbar = <Toolbar id="toolbar" isFullHeight isStatic>
    <ToolbarContent>
      <ToolbarGroup variant="action-group-plain" align={{
        default: "alignEnd"
      }} gap={{
        default: "gapNone",
        md: "gapMd"
      }}>

        <ToolbarItem visibility={{
          default: 'hidden',
          md: 'visible',
          lg: 'hidden'
        }}>

        </ToolbarItem>
        <ToolbarItem visibility={{
          md: 'hidden'
        }}>
        </ToolbarItem>
      </ToolbarGroup>
      <ToolbarItem visibility={{
        default: 'hidden',
        md: 'visible'
      }}>
        <Dropdown isOpen={isDropdownOpen} onSelect={onDropdownSelect} onOpenChange={setIsDropdownOpen} popperProps={{
          position: 'right'
        }} toggle={toggleRef => <MenuToggle ref={toggleRef} isExpanded={isDropdownOpen} onClick={onDropdownToggle} icon={<Avatar src={imgAvatar} alt="" />} isFullHeight>
          {userName}
        </MenuToggle>}>
          <DropdownList>{userDropdownItems}</DropdownList>
        </Dropdown>
      </ToolbarItem>
    </ToolbarContent>
  </Toolbar>;
  const Header = <Masthead>
    <MastheadMain><MastheadToggle>
      <PageToggleButton variant="plain" aria-label='Global navigation' isSidebarOpen={isSidebarOpen} onSidebarToggle={onSidebarToggle} id='vertical-nav-toggle'>
        <BarsIcon />
      </PageToggleButton>
    </MastheadToggle>
      <MastheadBrand>
        <Title headingLevel='h2'>ExploitIQ - GUI</Title>
      </MastheadBrand>
    </MastheadMain>
    <MastheadContent>{headerToolbar}</MastheadContent>
  </Masthead>;
  const pageId = 'main-content-page-layout-horizontal-nav';
  const PageSkipToContent = <SkipToContent href={`#${pageId}`}>Skip to content</SkipToContent>;
  return <React.Fragment>
    <Page masthead={Header} skipToContent={PageSkipToContent} mainContainerId={pageId} sidebar={sidebar}>
      <Outlet context={{ vulnRequest, handleVulnRequestChange, productVulnRequest, handleProductVulnRequestChange, sourceRequest, handleSourceRequestChange, addAlert }} />
      <ToastNotifications alerts={alerts} onDeleteAlert={onDeleteAlert} />
    </Page>
  </React.Fragment>;
};

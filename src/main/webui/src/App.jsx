import { Avatar, Dropdown, DropdownItem, DropdownList, Masthead, MastheadMain, MastheadBrand, MastheadContent, MenuToggle, Nav, NavItem, NavList, Page, SkipToContent, Text, Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem, MastheadToggle, PageToggleButton, PageSidebar, PageSidebarBody } from '@patternfly/react-core';
import imgAvatar from '@patternfly/react-core/src/components/assets/avatarImg.svg';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ToastNotifications } from './components/Notifications';
import BarsIcon from '@patternfly/react-icons/dist/esm/icons/bars-icon';

export default function App() {

  const [vulnRequest, setVulnRequest] = React.useState({ sbomType: 'csv' });
  const [alerts, setAlerts] = React.useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

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
      if(data.result === "Created") {
        addAlert('Info', 'New report received', <p>Report: {data.name} reveived.<div><Link to={`/reports/${data.id}`} onClick={onLinkToReportClicked}>View</Link></div></p>)
      } else {
        addAlert('Error', 'Error received', <p>Error: {data.result}</p>);
      }
    });
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

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const location = useLocation();

  const onDropdownToggle = () => setIsDropdownOpen(prevState => !prevState);
  const onDropdownSelect = () => setIsDropdownOpen(false);

  const PageNav = <Nav aria-label="Nav">
    <NavList>
      <NavItem itemId={0} isActive={location.pathname === '/'} to="#">
        Request Analysis
      </NavItem>
      <NavItem itemId={1} isActive={location.pathname.startsWith('/reports')} to="#/reports">
        View Reports
      </NavItem>
      <NavItem itemId={2} isActive={location.pathname.startsWith('/vulnerabilities')} to="#/vulnerabilities">
        Vulnerabilities
      </NavItem>
    </NavList>
  </Nav>;

  const userDropdownItems = <>
    <DropdownItem key="group 2 profile">My profile</DropdownItem>
    <DropdownItem key="group 2 logout">Logout</DropdownItem>
  </>;
  const sidebar = <PageSidebar isSidebarOpen={isSidebarOpen} id='vertical-sidebar'>
    <PageSidebarBody>{PageNav}</PageSidebarBody>
  </PageSidebar>
  const headerToolbar = <Toolbar id="toolbar" isFullHeight isStatic>
    <ToolbarContent>
      <ToolbarGroup variant="icon-button-group" align={{
        default: 'alignRight'
      }} spacer={{
        default: 'spacerNone',
        md: 'spacerMd'
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
          Kermit
        </MenuToggle>}>
          <DropdownList>{userDropdownItems}</DropdownList>
        </Dropdown>
      </ToolbarItem>
    </ToolbarContent>
  </Toolbar>;
  const Header = <Masthead>
    <MastheadToggle>
      <PageToggleButton variant="plain" aria-label='Global navigation' isSidebarOpen={isSidebarOpen} onSidebarToggle={onSidebarToggle} id='vertical-nav-toggle'>
        <BarsIcon />
      </PageToggleButton>
    </MastheadToggle>
    <MastheadMain>
      <MastheadBrand>
        <Text>Agent Morpheus</Text>
      </MastheadBrand>
    </MastheadMain>
    <MastheadContent>{headerToolbar}</MastheadContent>
  </Masthead>;
  const pageId = 'main-content-page-layout-horizontal-nav';
  const PageSkipToContent = <SkipToContent href={`#${pageId}`}>Skip to content</SkipToContent>;
  return <React.Fragment>
    <Page header={Header} skipToContent={PageSkipToContent} mainContainerId={pageId} sidebar={sidebar}>
      <Outlet context={{ vulnRequest, handleVulnRequestChange, addAlert }} />
      <ToastNotifications alerts={alerts} onDeleteAlert={onDeleteAlert} />
    </Page>
  </React.Fragment>;
};

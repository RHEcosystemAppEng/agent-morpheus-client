import { Avatar, Dropdown, DropdownItem, DropdownList, Masthead, MastheadMain, MastheadBrand, MastheadContent, MenuToggle, Nav, NavItem, NavList, Page, SkipToContent, Text, Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import imgAvatar from '@patternfly/react-core/src/components/assets/avatarImg.svg';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ToastNotifications } from './components/Notifications';

export default function App() {

  const [vulnRequest, setVulnRequest] = React.useState({ sbomType: 'csv' });
  const [alerts, setAlerts] = React.useState([]);
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
      console.log(`Received new report: ${event.data}`);
      addAlert('Info', 'New report received', <p>Report: {event.data} reveived.<div><Link to={`/reports/${event.data}`} onClick={onLinkToReportClicked}>View</Link></div></p>)
    })
  }, []);

  const onLinkToReportClicked = () => {
    onDeleteAlert(-1);
    setActiveItem(1);
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

  const handleVulnRequestChange = (changes) => {
    let updated = { ...vulnRequest }
    Object.assign(updated, changes)
    setVulnRequest(updated);
    return updated;
  };

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const location = useLocation();
  let currTab = 0;
  if (location.pathname.startsWith('/reports')) {
    currTab = 1;
  }
  const [activeItem, setActiveItem] = React.useState(currTab);
  const onNavSelect = (_event, selectedItem) => setActiveItem(selectedItem.itemId);
  const onDropdownToggle = () => setIsDropdownOpen(prevState => !prevState);
  const onDropdownSelect = () => setIsDropdownOpen(false);

  const PageNav = <Nav onSelect={onNavSelect} aria-label="Nav" variant="horizontal">
    <NavList>
      <NavItem itemId={0} isActive={activeItem === 0} to="#">
        <Link to={'/'}>Request Analysis</Link>
      </NavItem>
      <NavItem itemId={1} isActive={activeItem === 1} to="#">
        <Link to={'/reports'}>View Reports</Link>
      </NavItem>
    </NavList>
  </Nav>;
  const userDropdownItems = <>
    <DropdownItem key="group 2 profile">My profile</DropdownItem>
    <DropdownItem key="group 2 logout">Logout</DropdownItem>
  </>;
  const headerToolbar = <Toolbar id="toolbar" isFullHeight isStatic>
    <ToolbarContent>
      <ToolbarItem isOverflowContainer>{PageNav}</ToolbarItem>
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
    <Page header={Header} skipToContent={PageSkipToContent} mainContainerId={pageId}>
      <Outlet context={{ vulnRequest, handleVulnRequestChange, addAlert }} />
      <ToastNotifications alerts={alerts} onDeleteAlert={onDeleteAlert} />
    </Page>
  </React.Fragment>;
};

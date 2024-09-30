import { Avatar, Dropdown, DropdownItem, DropdownList, Masthead, MastheadMain, MastheadBrand, MastheadContent, MenuToggle, Nav, NavItem, NavList, Page, SkipToContent, Text, Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import imgAvatar from '@patternfly/react-core/src/components/assets/avatarImg.svg';
import { Link, Outlet } from 'react-router-dom';

export default function App() {

  const [vulnRequest, setVulnRequest] = React.useState({ sbomType: 'csv' });

  const handleVulnRequestChange = (changes) => {
    let updated = { ...vulnRequest }
    Object.assign(updated, changes)
    setVulnRequest(updated);
    return updated;
  };

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const [activeItem, setActiveItem] = React.useState(0);
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
        <Text>Agent Morpheus - Client</Text>
      </MastheadBrand>
    </MastheadMain>
    <MastheadContent>{headerToolbar}</MastheadContent>
  </Masthead>;
  const pageId = 'main-content-page-layout-horizontal-nav';
  const PageSkipToContent = <SkipToContent href={`#${pageId}`}>Skip to content</SkipToContent>;
  return <React.Fragment>
    <Page header={Header} skipToContent={PageSkipToContent} mainContainerId={pageId}>
      <Outlet context={[vulnRequest, handleVulnRequestChange]} />
    </Page>
  </React.Fragment>;
};

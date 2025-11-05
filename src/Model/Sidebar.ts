export interface SidebarLinkGroupProps {
  children: (handleClick: () => void, open: boolean) => React.ReactNode;
  activeCondition: boolean;
}

export interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: (arg: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  menuList: any[];
  type: 'STAFF' | 'ADMIN';
}

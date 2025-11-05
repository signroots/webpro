import './style.css';

import { Tabs } from 'antd';
import React from 'react';

const CustomTabs: React.FC<{
  items: any;
  activeKey?: string;
  onChange?: any;
  rootClass?: string;
}> = ({ items, activeKey, onChange, rootClass }) => {
  return (
    <Tabs
      className={rootClass}
      defaultActiveKey="1"
      items={items}
      activeKey={activeKey}
      onChange={onChange}
      destroyInactiveTabPane={false}
    />
  );
};
export default CustomTabs;

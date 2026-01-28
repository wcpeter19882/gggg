'use client';

/**
 * Layout - Styled for slide layouts
 * 
 * Maps Ant Design's Layout components for dashboard-style slides.
 */

import React from 'react';
import { Layout as AntLayout, type LayoutProps } from 'antd';
import styles from './Layout.module.css';

const { Header: AntHeader, Footer: AntFooter, Sider: AntSider, Content: AntContent } = AntLayout;

export function Layout({ className = '', ...rest }: LayoutProps) {
  return (
    <AntLayout
      className={`${styles.layout} ${className}`}
      {...rest}
    />
  );
}

export function Header({ className = '', ...rest }: LayoutProps) {
  return (
    <AntHeader
      className={`${styles.header} ${className}`}
      {...rest}
    />
  );
}

export function Footer({ className = '', ...rest }: LayoutProps) {
  return (
    <AntFooter
      className={`${styles.footer} ${className}`}
      {...rest}
    />
  );
}

export function Sider({ className = '', ...rest }: React.ComponentProps<typeof AntSider>) {
  return (
    <AntSider
      className={`${styles.sider} ${className}`}
      {...rest}
    />
  );
}

export function Content({ className = '', ...rest }: LayoutProps) {
  return (
    <AntContent
      className={`${styles.content} ${className}`}
      {...rest}
    />
  );
}

// Attach sub-components
Layout.Header = Header;
Layout.Footer = Footer;
Layout.Sider = Sider;
Layout.Content = Content;

export default Layout;

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  permission?: string;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    href: '/',                 icon: 'LayoutDashboard' },
  { label: 'Orders',       href: '/orders',           icon: 'ShoppingBag',     permission: 'orders.view' },
  { label: 'Live Tracking',href: '/tracking',         icon: 'MapPin',          permission: 'orders.view' },
  {
    label: 'Catalog', href: '#', icon: 'Package', permission: 'catalog.view',
    children: [
      { label: 'Categories', href: '/catalog/categories', icon: 'Tag' },
      { label: 'Products',   href: '/catalog/products',   icon: 'Box' },
      { label: 'Inventory',  href: '/catalog/inventory',  icon: 'Warehouse' },
    ]
  },
  { label: 'Banners',       href: '/banners',         icon: 'Image',           permission: 'banners.view' },
  { label: 'Coupons',       href: '/coupons',         icon: 'Ticket',          permission: 'coupons.view' },
  { label: 'FAQs',          href: '/faqs',            icon: 'HelpCircle',      permission: 'banners.view' },
  { label: 'Info Pages',    href: '/info-pages',      icon: 'FileText',        permission: 'banners.view' },
  { label: 'Referrals',     href: '/referrals',       icon: 'Users2',          permission: 'referrals.view' },
  { label: 'Dark Stores',   href: '/dark-stores',     icon: 'Store',           permission: 'dark_stores.view' },
  { label: 'Riders',        href: '/riders',          icon: 'Bike',            permission: 'riders.view' },
  { label: 'Customers',     href: '/customers',       icon: 'Users',           permission: 'customers.view' },
  { label: 'Support',       href: '/support',         icon: 'MessageSquare',   permission: 'support.view' },
  { label: 'Payments',      href: '/payments',        icon: 'CreditCard',      permission: 'payments.view' },
  { label: 'Wallet',        href: '/wallet',          icon: 'Wallet',          permission: 'wallet.view' },
  { label: 'Notifications', href: '/notifications',   icon: 'Bell',            permission: 'notifications.view' },
  { label: 'Reports',       href: '/reports',         icon: 'BarChart2',       permission: 'reports.view' },
  { label: 'Admin Users',   href: '/admin-users',     icon: 'Shield',          permission: 'admin_users.view' },
  { label: 'Settings',      href: '/settings',        icon: 'Settings',        permission: 'settings.view' },
];

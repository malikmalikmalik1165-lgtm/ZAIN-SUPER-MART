export const STORE = {
  name: "ZAIN SUPER MART",
  phone: "03117054563",
  address: "Bhera–Malakwal Road, Miani",
  shortName: "ZSM",
} as const;

export const DEVELOPER = {
  name: "Malik Danial",
  phone: "03180283104",
} as const;

export const NAV_SECTIONS = [
  {
    label: "",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" as const },
    ],
  },
  {
    label: "Sales",
    items: [
      { name: "POS / Billing", href: "/pos", icon: "ShoppingCart" as const },
    ],
  },
  {
    label: "Inventory",
    items: [
      { name: "Products", href: "/products", icon: "Package" as const },
      { name: "Categories", href: "/categories", icon: "Tag" as const },
      { name: "Stock", href: "/inventory", icon: "Warehouse" as const },
    ],
  },
  {
    label: "Purchasing",
    items: [
      { name: "Purchases", href: "/purchases", icon: "Truck" as const },
      { name: "Suppliers", href: "/suppliers", icon: "Users" as const },
    ],
  },
  {
    label: "Customers",
    items: [
      { name: "Customers", href: "/customers", icon: "UserCheck" as const },
    ],
  },
  {
    label: "Finance",
    items: [
      { name: "Expenses", href: "/expenses", icon: "Receipt" as const },
      { name: "Reports", href: "/reports", icon: "BarChart3" as const },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", href: "/settings", icon: "Settings" as const },
    ],
  },
] as const;

// Future user roles
export const USER_ROLES = {
  ADMIN: "admin",
  CASHIER: "cashier",
  STOCK_MANAGER: "stock_manager",
} as const;

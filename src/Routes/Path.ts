// paths.ts

export interface PathsType {
  signIn: string;

  Admin: {
    login: string;
    dashboard: string;
    domains: string;
    customers: {
      index: string;
      new: string;
      details: (id?: string | number) => string;
    };
    registration: string;
    status: string;
    orders: {
      index: string;
      new: string;
      details: (orderId?: string | number) => string;
      edit: (orderId?: string | number) => string;
    };
    categories: string;
    userTypes: string;
  };

  Customer: {
    login: string;
    dashboard: string;
    orders: {
      index: string;
      details: (orderId?: string | number) => string;
    };
  };

  error: string;
  unauthorized: string;
}

const Paths: PathsType = {
  signIn: '/signin',

  Admin: {
    login: '/admin/login',
    dashboard: '/admin/dashboard',
    domains: '/admin/domains',
    customers: {
      index: '/admin/customers',
      new: '/admin/customers/new',
      details: (id = ':id') => `/admin/customers/${id}`,
    },
    registration: '/admin/registration',
    status: '/admin/status',
    orders: {
      index: '/admin/orders',
      new: '/admin/orders/new',
      details: (orderId = ':orderId') => `/admin/orders/${orderId}`,
      edit: (orderId = ':orderId') => `/admin/orders/update/${orderId}`,
    },
    categories: '/admin/categories',
    userTypes: '/admin/user-types',
  },

  Customer: {
    login: '/customer/login',
    dashboard: '/customer/dashboard',
    orders: {
      index: '/customer/orders',
      details: (orderId = ':orderId') => `/customer/orders/${orderId}`,
    },
  },

  error: '*',
  unauthorized: '/unauthorized',
};

export default Paths;

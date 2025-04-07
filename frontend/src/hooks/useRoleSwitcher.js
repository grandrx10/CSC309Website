import { useState, useEffect } from 'react';

const ROLE_HIERARCHY = {
  'superuser': ['superuser', 'manager', 'cashier', 'regular'],
  'manager': ['manager', 'cashier', 'regular'],
  'cashier': ['cashier', 'regular'],
  'regular': ['regular']
};

export const useRoleSwitcher = (userRole) => {
  const [currentViewRole, setCurrentViewRole] = useState(userRole?.toLowerCase() || 'regular');
  
  // Initialize from localStorage if available
  useEffect(() => {
    const savedRole = localStorage.getItem('currentViewRole');
    if (savedRole && ROLE_HIERARCHY[userRole?.toLowerCase()]?.includes(savedRole)) {
      setCurrentViewRole(savedRole);
    } else if (userRole) {
      setCurrentViewRole(userRole.toLowerCase());
    }
  }, [userRole]);

  const handleRoleChange = (role) => {
    setCurrentViewRole(role);
    localStorage.setItem('currentViewRole', role);
  };

  const availableRoles = userRole ? ROLE_HIERARCHY[userRole.toLowerCase()] || ['regular'] : ['regular'];

  return {
    currentViewRole,
    handleRoleChange,
    availableRoles
  };
};
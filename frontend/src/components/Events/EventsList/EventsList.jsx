import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Pagination, Space, message, Dropdown } from 'antd';
import { PlusOutlined, SyncOutlined, UserOutlined } from '@ant-design/icons';
import EventsTable from './EventsTable';
import EventsFilters from './EventsFilters';
import styles from './EventsList.module.css';
import NavBar from '../../NavBar';

// Define role hierarchy
const ROLE_HIERARCHY = {
  'superuser': ['superuser', 'manager', 'cashier', 'regular'],
  'manager': ['manager', 'cashier', 'regular'],
  'cashier': ['cashier', 'regular'],
  'regular': ['regular']
};
const API_URL =  "http://localhost:3100"; // import.meta.env.VITE_API_URL ||
const EventsList = () => {
  const [state, setState] = useState({
    events: [],
    loading: false,
    pagination: { 
      current: 1, 
      pageSize: 10, 
      total: 0
    },
    filters: { 
      search: '', 
      status: 'all', 
      dateRange: null,
      sortBy: 'startTime',
      sortOrder: 'asc',
      organizerOnly: false,
      showFull: false
    },
    pendingSearch: ''
  });

  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [currentViewRole, setCurrentViewRole] = useState(null);
  const [showSettings, setShowSettings] = useState({
    showCreateButton: false,
    showStatusFilter: false,
    showOrganizerFilter: false,
    showActionsColumn: false
  });

  const navigate = useNavigate();

  // Fetch current user data
  const fetchCurrentUser = useCallback(async () => {
    try {
      setUserLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(API_URL + '/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/login');
          throw new Error('Session expired. Please login again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const userData = await response.json();
      setUser(userData);
      setCurrentViewRole(userData.role.toLowerCase()); // Initialize with user's actual role
      setUserLoading(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      message.error(error.message || 'Failed to load user data');
      setUserLoading(false);
    }
  }, [navigate]);

  // Update show settings based on current view role
  useEffect(() => {
    if (!currentViewRole || !user) return;
    
    // Only managers and superusers get special privileges
    const isPrivileged = ['manager', 'superuser'].includes(currentViewRole);
    console.log(isPrivileged)
    setShowSettings({
      // Only managers and superusers can create events
      showCreateButton: isPrivileged,
      
      // Only managers and superusers can see status filter
      showStatusFilter: isPrivileged,
      
      // Everyone can see organizer filter
      showOrganizerFilter: true,
      
      // Only managers and superusers can see action buttons (edit)
      showActionsColumn: isPrivileged
    });
  }, [currentViewRole, user]);

  // Fetch events from the API
  const fetchEvents = useCallback(async () => {
    if (userLoading) return;
    
    setState(prev => ({ ...prev, loading: true }));
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: state.pagination.current,
        limit: state.pagination.pageSize,
        sortBy: state.filters.sortBy,
        sortOrder: state.filters.sortOrder
      });

      // Add name search if provided
      if (state.filters.search) {
        params.set('name', state.filters.search);
      }

      // Add published status if not 'all' and user has privileges
      if (['manager', 'superuser'].includes(currentViewRole) && 
          (state.filters.status === 'published' || state.filters.status === 'draft')) {
        params.set('published', state.filters.status === 'published' ? 'true' : 'false');
      }

      // Add date range if provided
      if (state.filters.dateRange && state.filters.dateRange.length === 2) {
        params.set('startDate', state.filters.dateRange[0]);
        params.set('endDate', state.filters.dateRange[1]);
      }

      // Add organizer filter if enabled
      if (state.filters.organizerOnly && user) {
        params.set('organizerId', user.utorid);
      }

      if (state.filters.fullEvents) {
        params.set('showFull', true);
      }

      // Clean up undefined parameters
      Array.from(params.keys()).forEach(key => {
        if (params.get(key) === 'undefined' || params.get(key) === 'null' || params.get(key) === '') {
          params.delete(key);
        }
      });
      const response = await fetch(API_URL + `/events?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/login');
          throw new Error('Session expired. Please login again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      const { count, results } = data;
      console.log(results.length);
      
      setState(prev => ({
        ...prev,
        events: results || [],
        loading: false,
        pagination: {
          ...prev.pagination,
          total: count
        }
      }));
      
    } catch (error) {
      console.error('Error fetching events:', error);
      setState(prev => ({ ...prev, loading: false }));
      
      message.error({
        content: error.message || 'Failed to load events',
        duration: 3
      });

      if (error.message.includes('Session expired')) {
        navigate('/login');
      }
    }
  }, [
    state.pagination.current, 
    state.pagination.pageSize, 
    state.filters.search,
    state.filters.status,
    state.filters.dateRange,
    state.filters.sortBy,
    state.filters.sortOrder,
    state.filters.organizerOnly,
    state.filters.showFull,
    navigate,
    user,
    userLoading,
    currentViewRole
  ]);

  // Handle role change
  const handleRoleChange = (role) => {
    setCurrentViewRole(role);
  };

  // Render role dropdown
  const renderRoleDropdown = () => {
    if (!user) return null;
    
    const userRole = user.role.toLowerCase();
    const availableRoles = ROLE_HIERARCHY[userRole] || ['regular'];
    
    const items = availableRoles.map(role => ({
      key: role,
      label: role.charAt(0).toUpperCase() + role.slice(1)
    }));
    
    return (
      <Dropdown 
        menu={{ items, onClick: ({ key }) => handleRoleChange(key) }}
        placement="bottomRight"
      >
        <Button icon={<UserOutlined />}>
          Viewing as: {currentViewRole ? currentViewRole.charAt(0).toUpperCase() + currentViewRole.slice(1) : 'Unknown'}
        </Button>
      </Dropdown>
    );
  };

  // Load user data and events on initial render
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Fetch events when dependencies change
  useEffect(() => {
    if (!userLoading) {
      fetchEvents();
    }
  }, [fetchEvents, userLoading, currentViewRole]);

  // Handle search input changes without triggering API call
  const handleSearchInputChange = (value) => {
    setState(prev => ({
      ...prev,
      pendingSearch: value
    }));
  };

  // Submit search only when the search button is clicked or Enter key is pressed
  const handleSearchSubmit = (value) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, search: value },
      pendingSearch: value,
      pagination: { ...prev.pagination, current: 1 }
    }));
  };

  const handleFilterChange = (filterName, value) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [filterName]: value },
      pagination: { ...prev.pagination, current: 1 }
    }));
  };

  // Handle table sorting
  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter && sorter.field) {
      const newSortOrder = sorter.order === 'descend' ? 'desc' : 'asc';
      setState(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          sortBy: sorter.field,
          sortOrder: newSortOrder
        },
        pagination: { ...prev.pagination, current: 1 }
      }));
    }
  };

  return (
    <NavBar>
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Manage Events</h2>
        <Space>
          <Button 
            icon={<SyncOutlined />} 
            onClick={fetchEvents}
            loading={state.loading || userLoading}
          >
            Refresh
          </Button>
          {showSettings.showCreateButton && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/events/create')}
            >
              Create Event
            </Button>
          )}
          {renderRoleDropdown()}
        </Space>
      </div>

      <EventsFilters 
        filters={state.filters}
        pendingSearch={state.pendingSearch}
        onSearchChange={handleSearchInputChange}
        onSearchSubmit={handleSearchSubmit}
        onFilterChange={handleFilterChange}
        showStatusFilter={showSettings.showStatusFilter}
        showOrganizerFilter={showSettings.showOrganizerFilter && !!user}
        isOrganizerFilterActive={state.filters.organizerOnly}
        showFullEvents={state.filters.showFull}
        onShowFullChange={handleFilterChange}
      />

      <EventsTable
        events={state.events}
        loading={state.loading || userLoading}
        onRowClick={(id) => navigate(`/events/${id}`)}
        onEdit={showSettings.showActionsColumn ? (id) => navigate(`/events/${id}/edit`) : null}
        onChange={handleTableChange}
        isPrivileged={showSettings.showStatusFilter}
      />

      <div className={styles.paginationContainer}>
        <Pagination
          current={state.pagination.current}
          pageSize={state.pagination.pageSize}
          total={state.pagination.total}
          onChange={(page, pageSize) => {
            setState(prev => ({
              ...prev,
              pagination: { 
                ...prev.pagination, 
                current: page,
                pageSize: pageSize || prev.pagination.pageSize 
              }
            }));
          }}
          showSizeChanger
          pageSizeOptions={['5', '10', '20', '50']}
          showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
          className={styles.pagination}
        />
        {process.env.NODE_ENV === 'development' && (
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            Total items: {state.pagination.total}, 
            Page: {state.pagination.current}, 
            Size: {state.pagination.pageSize}
          </div>
        )}
      </div>
    </div>
    </NavBar>
  );
};

export default EventsList;
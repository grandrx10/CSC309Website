import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Pagination, Space, message } from 'antd';
import { PlusOutlined, SyncOutlined } from '@ant-design/icons';
import EventsTable from './EventsTable';
import EventsFilters from './EventsFilters';
import styles from './EventsList.module.css';
import dayjs from 'dayjs';

const EventsView = ({
  variant = 'user', // 'user' | 'organizer' | 'manager'
  title = 'Events',
  columns, // Custom columns override
  initialFilters = {}
}) => {
  const [state, setState] = useState({
    events: [],
    loading: false,
    pagination: { current: 1, pageSize: 10, total: 0 },
    filters: { 
      search: '', 
      status: 'all', 
      dateRange: null,
      ...initialFilters
    }
  });
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showSettings, setShowSettings] = useState({
    showCreateButton: false,
    showStatusFilter: false,
    showPointsColumn: false
  });

  const navigate = useNavigate();

  // Fetch current user
  const fetchCurrentUser = useCallback(async () => {
    try {
      setUserLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch('http://localhost:3100/users/me', {
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

      const isPrivileged = ['manager', 'superuser'].includes(userData.role.toLowerCase());
      setShowSettings({
        showCreateButton: isPrivileged,
        showStatusFilter: isPrivileged,
        showPointsColumn: isPrivileged
      });
      setUserLoading(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      message.error(error.message || 'Failed to load user data');
      setUserLoading(false);
    }
  }, [navigate]);

  const fetchEvents = useCallback(async () => {
    if (!user && variant === 'organizer') {
      await fetchCurrentUser();
      return;
    }

    setState(prev => ({ ...prev, loading: true }));
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const params = new URLSearchParams({
        page: state.pagination.current,
        limit: state.pagination.pageSize,
        name: state.filters.search,
        ...(showSettings.showStatusFilter && { 
          published: state.filters.status === 'published' ? 'true' : 
                   state.filters.status === 'draft' ? 'false' : 
                   undefined 
        }),
        ...(state.filters.dateRange && {
          started: state.filters.dateRange[0]?.toISOString(),
          ended: state.filters.dateRange[1]?.toISOString()
        })
      });

      // Clean up undefined parameters
      Array.from(params.keys()).forEach(key => {
        if (params.get(key) === 'undefined' || params.get(key) === 'null') {
          params.delete(key);
        }
      });

      // Add role-specific filters
      if (variant === 'organizer' && user) {
        params.set('organizerId', user.id);
      }

      const response = await fetch(`http://localhost:3100/events?${params.toString()}`, {
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

      const { count, results } = await response.json();
      
      setState(prev => ({
        ...prev,
        events: results,
        pagination: { ...prev.pagination, total: count },
        loading: false
      }));

    } catch (error) {
      console.error('Error fetching events:', error);
      setState(prev => ({ ...prev, loading: false }));
      message.error(error.message || 'Failed to load events');
    }
  }, [
    state.pagination.current, 
    state.pagination.pageSize, 
    state.filters,
    variant,
    navigate,
    user,
    fetchCurrentUser,
    showSettings.showStatusFilter
  ]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if ((user || variant !== 'organizer') && !userLoading) {
      fetchEvents();
    }
  }, [fetchEvents, user, variant, userLoading]);

  const handleFilterChange = (filterName, value) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [filterName]: value },
      pagination: { ...prev.pagination, current: 1 }
    }));
  };

  // Memoized columns to prevent unnecessary recalculations
  const defaultColumns = useMemo(() => [
    {
      title: 'Event Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => navigate(`/events/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (text) => dayjs(text).format('MMM D, YYYY h:mm A'),
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (text) => dayjs(text).format('MMM D, YYYY h:mm A'),
    },
    ...(showSettings.showPointsColumn ? [{
      title: 'Points',
      dataIndex: 'pointsRemain',
      key: 'points',
      render: (text, record) => `${record.pointsAwarded}/${text + record.pointsAwarded}`,
    }] : []),
    ...(showSettings.showStatusFilter ? [{
      title: 'Status',
      dataIndex: 'published',
      key: 'status',
      render: (published) => (
        <span className={published ? styles.published : styles.draft}>
          {published ? 'Published' : 'Draft'}
        </span>
      ),
    }] : [])
  ], [showSettings.showPointsColumn, showSettings.showStatusFilter, navigate]);

  if (userLoading) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{title}</h2>
        <Space>
          <Button 
            icon={<SyncOutlined />} 
            onClick={fetchEvents}
            loading={state.loading}
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
        </Space>
      </div>

      <EventsFilters 
        showStatusFilter={showSettings.showStatusFilter}
        filters={state.filters} 
        onFilterChange={handleFilterChange} 
      />

        <EventsTable
        events={state.events}
        loading={state.loading}
        onRowClick={(id) => navigate(`/events/${id}`)}
        showPointsColumn={showSettings.showPointsColumn}
        showStatusColumn={showSettings.showStatusFilter}
        showActionsColumn={showSettings.showCreateButton} // Or create a separate setting for actions
        />

      <Pagination
        current={state.pagination.current}
        pageSize={state.pagination.pageSize}
        total={state.pagination.total}
        onChange={(page) => setState(prev => ({
          ...prev,
          pagination: { ...prev.pagination, current: page }
        }))}
        className={styles.pagination}
      />
    </div>
  );
};

export default EventsView;
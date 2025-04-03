import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Pagination, Space, message } from 'antd';
import { PlusOutlined, SyncOutlined } from '@ant-design/icons';
import EventsTable from './EventsTable';
import EventsFilters from './EventsFilters';
import styles from './EventsList.module.css';

const EventsList = () => {
  const [state, setState] = useState({
    events: [],
    loading: false,
    pagination: { current: 1, pageSize: 10, total: 0 },
    filters: { search: '', status: 'all', dateRange: null }
  });

  const navigate = useNavigate();

  const fetchEvents = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
  
      const params = new URLSearchParams({
        page: state.pagination.current,
        limit: state.pagination.pageSize,
        name: state.filters.search,
        published: state.filters.status === 'published' ? 'true' : 
                 state.filters.status === 'draft' ? 'false' : 
                 undefined,
        started: state.filters.dateRange?.[0]?.toISOString(),
        ended: state.filters.dateRange?.[1]?.toISOString()
      });
  
      // Clean up undefined parameters
      Array.from(params.keys()).forEach(key => {
        if (params.get(key) === 'undefined' || params.get(key) === 'null') {
          params.delete(key);
        }
      });
  
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
      setState(prev => ({
        ...prev,
        loading: false
      }));
      
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
    navigate
  ]);

  // Add this useEffect to trigger initial load
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFilterChange = (filterName, value) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [filterName]: value },
      pagination: { ...prev.pagination, current: 1 }
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Manage Events</h2>
        <Space>
          <Button 
            icon={<SyncOutlined />} 
            onClick={fetchEvents}
            loading={state.loading}
          >
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/events/create')}
          >
            Create Event
          </Button>
        </Space>
      </div>

      <EventsFilters 
        filters={state.filters} 
        onFilterChange={handleFilterChange} 
      />

      <EventsTable
        events={state.events}
        loading={state.loading}
        onRowClick={(id) => navigate(`/events/${id}`)}
        onEdit={(id) => navigate(`/events/${id}/edit`)}
        onManageUsers={(id) => navigate(`/events/${id}/users`)}
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

export default EventsList;
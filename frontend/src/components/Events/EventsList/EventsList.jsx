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
    allEvents: [], // Store all fetched events before filtering
    loading: false,
    pagination: { current: 1, pageSize: 10, total: 0 },
    filters: { search: '', status: 'all', dateRange: null }
  });

  const navigate = useNavigate();

  // Separate fetching from API and filtering logic
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
        // Don't send dateRange to backend since we'll filter locally
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
      
      // Store all events from API
      setState(prev => ({
        ...prev,
        allEvents: results,
        loading: false
      }));
      
      // Then apply filters (this will trigger the applyFilters effect)
      
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
    navigate
  ]);

  // Apply filters to the fetched events
  const applyFilters = useCallback(() => {
    const { allEvents, filters } = state;
    
    if (!allEvents.length) return;
    
    let filteredEvents = [...allEvents];
    
    // Filter by date range if specified
    if (filters.dateRange && filters.dateRange.length === 2 && 
        filters.dateRange[0] && filters.dateRange[1]) {
      const startDate = new Date(filters.dateRange[0]);
      const endDate = new Date(filters.dateRange[1]);
      
      filteredEvents = filteredEvents.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart >= startDate && eventStart <= endDate;
      });
    }
    
    // Sort by start time (ascending)
    filteredEvents.sort((a, b) => {
      return new Date(a.startTime) - new Date(b.startTime);
    });
    
    setState(prev => ({
      ...prev,
      events: filteredEvents,
      pagination: { 
        ...prev.pagination, 
        total: filteredEvents.length, // Update total for pagination
        current: 1 // Reset to first page when filters change
      }
    }));
  }, [state.allEvents, state.filters]);

  // Fetch events on initial load and when fetch dependencies change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  
  // Apply filters whenever allEvents or filters change
  useEffect(() => {
    applyFilters();
  }, [applyFilters, state.allEvents, state.filters.dateRange]);

  const handleFilterChange = (filterName, value) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [filterName]: value }
    }));
  };

  // Get paginated events slice for display
  const paginatedEvents = useMemo(() => {
    const { current, pageSize } = state.pagination;
    const startIndex = (current - 1) * pageSize;
    return state.events.slice(startIndex, startIndex + pageSize);
  }, [state.events, state.pagination.current, state.pagination.pageSize]);

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
        events={paginatedEvents}
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
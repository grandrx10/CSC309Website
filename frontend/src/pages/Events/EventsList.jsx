import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, Input, Select, DatePicker, Pagination } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, UserOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from './EventsList.module.css';

const { Search } = Input;
const { Option } = Select;

const EventsList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: null,
    sortBy: 'startTime',
  });
  const navigate = useNavigate();

  // Wrap fetchEvents in useCallback to memoize it
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
  
      const params = new URLSearchParams({
        page: pagination.current,
        limit: pagination.pageSize,
        search: filters.search,
        status: filters.status,
        sortBy: filters.sortBy,
      });
  
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange[0].toISOString());
        params.append('endDate', filters.dateRange[1].toISOString());
      }
  
      const response = await fetch(`http://localhost:3100/events?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        // Handle specific HTTP errors
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/login');
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const { count, results } = await response.json(); // Destructure the actual response
      console.log('Received data:', { count, results }); // Debug log
      
      setEvents(results); // Use results instead of events
      setPagination(prev => ({ ...prev, total: count })); // Use count instead of total
    } catch (error) {
      console.error('Error fetching events:', error);
      // Show user-friendly error message
      // setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters, navigate]);

  // Fetch events on component mount and when dependencies change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchEvents();
  };

  const columns = [
    {
      title: 'Event Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Button type="link" onClick={() => navigate(`/events/${record.id}`)}>
          {text}
        </Button>
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
      sorter: true,
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (text) => dayjs(text).format('MMM D, YYYY h:mm A'),
    },
    {
      title: 'Points',
      dataIndex: 'pointsRemain',
      key: 'points',
      render: (text, record) => `${record.pointsAwarded}/${text + record.pointsAwarded}`,
    },
    {
      title: 'Status',
      dataIndex: 'published',
      key: 'status',
      render: (published) => (
        <span className={published ? styles.published : styles.draft}>
          {published ? 'Published' : 'Draft'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/events/${record.id}/edit`)}
          />
          <Button 
            icon={<UserOutlined />} 
            onClick={() => navigate(`/events/${record.id}/users`)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Manage Events</h2>
        <Space>
          <Button 
            icon={<SyncOutlined />} 
            onClick={handleRefresh}
            loading={loading}
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

      <div className={styles.filters}>
        <Search
          placeholder="Search events"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={(value) => setFilters({ ...filters, search: value })}
          className={styles.search}
        />

        <Select
          defaultValue="all"
          style={{ width: 120 }}
          onChange={(value) => setFilters({ ...filters, status: value })}
        >
          <Option value="all">All Status</Option>
          <Option value="published">Published</Option>
          <Option value="draft">Draft</Option>
        </Select>

        <DatePicker.RangePicker
          showTime
          onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
        />

        <Select
          defaultValue="startTime"
          style={{ width: 180 }}
          onChange={(value) => setFilters({ ...filters, sortBy: value })}
        >
          <Option value="startTime">Sort by Start Time</Option>
          <Option value="name">Sort by Name</Option>
          <Option value="points">Sort by Points</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={events}
        rowKey="id"
        pagination={false}
        loading={loading}
        className={styles.table}
      />

      <Pagination
        current={pagination.current}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onChange={(page) => setPagination({ ...pagination, current: page })}
        className={styles.pagination}
      />
    </div>
  );
};

export default EventsList;
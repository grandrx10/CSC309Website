import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Table, Button, Input, Select, Space, Card, message, Dropdown, Menu } from 'antd';
import { PlusOutlined, SyncOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import NavBar from '../../../components/NavBar';

const { Search } = Input;
const { Option } = Select;
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";

const ROLE_HIERARCHY = {
  'superuser': ['superuser', 'manager', 'cashier', 'regular'],
  'manager': ['manager', 'cashier', 'regular'],
  'cashier': ['cashier', 'regular'],
  'regular': ['regular']
};

const PromotionList = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [currentViewRole, setCurrentViewRole] = useState('regular');
  const navigate = useNavigate();
  const location = useLocation();

  const isManagerView = ['manager', 'superuser'].includes(currentViewRole);

  // Initialize state from URL parameters
  const initialParams = () => {
    const params = new URLSearchParams(location.search);
    return {
      pagination: {
        current: parseInt(params.get('page')) || 1,
        pageSize: parseInt(params.get('limit')) || 10,
        total: 0,
      },
      filters: {
        name: params.get('name') || '',
        type: params.get('type') || '',
        started: params.get('started') || undefined,
        ended: params.get('ended') || undefined
      }
    };
  };

  const [pagination, setPagination] = useState(initialParams().pagination);
  const [filters, setFilters] = useState(initialParams().filters);

  // Update URL with current state
  const updateURL = useCallback((newPagination, newFilters) => {
    const params = new URLSearchParams();
    
    // Add pagination parameters
    params.set('page', newPagination.current);
    params.set('limit', newPagination.pageSize);
    
    // Add filter parameters
    if (newFilters.name) params.set('name', newFilters.name);
    if (newFilters.type) params.set('type', newFilters.type);
    if (newFilters.started) params.set('started', newFilters.started);
    if (newFilters.ended) params.set('ended', newFilters.ended);
    
    navigate({ search: params.toString() }, { replace: true });
  }, [navigate]);

  const fetchUserRole = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/users/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.role) {
          const role = data.role.toLowerCase();
          setUserRole(role);
          
          const savedRole = localStorage.getItem('currentViewRole');
          const availableRoles = ROLE_HIERARCHY[role] || ['regular'];
          
          if (savedRole && availableRoles.includes(savedRole)) {
            setCurrentViewRole(savedRole);
          } else {
            setCurrentViewRole(role);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  }, []);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const params = new URLSearchParams({
        page: pagination.current,
        limit: pagination.pageSize,
      });
  
      // Add filters if they exist
      if (filters.name) params.append('name', filters.name);
      if (filters.type) params.append('type', filters.type);
      
      if (isManagerView) {
        // Only add started/ended if they are explicitly set
        if (filters.started === 'true' || filters.started === 'false') {
          params.append('started', filters.started);
        }
        if (filters.ended === 'true' || filters.ended === 'false') {
          params.append('ended', filters.ended);
        }
      }
  
      const response = await fetch(`${API_URL}/promotions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch promotions');
      }
  
      const data = await response.json();
      setPromotions(data.results || []);
      setPagination(prev => ({ ...prev, total: data.count || 0 }));
    } catch (err) {
      console.error('Error fetching promotions:', err);
      message.error(err.message);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters, isManagerView]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    const newPagination = { ...pagination, current: 1 };
    setPagination(newPagination);
    updateURL(newPagination, newFilters);
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
    updateURL(newPagination, filters);
  };

  const handleRoleChange = (role) => {
    setCurrentViewRole(role);
    localStorage.setItem('currentViewRole', role);
    
    // Reset filters completely when changing role
    const newFilters = {
      name: filters.name || '',
      type: filters.type || '',
      started: undefined,
      ended: undefined
    };
    
    setFilters(newFilters);
    const newPagination = { ...pagination, current: 1 };
    setPagination(newPagination);
    updateURL(newPagination, newFilters);
  };

  const renderRoleDropdown = () => {
    if (!userRole) return null;
    
    const availableRoles = ROLE_HIERARCHY[userRole] || ['regular'];
    
    const menu = (
      <Menu onClick={({ key }) => handleRoleChange(key)}>
        {availableRoles.map(role => (
          <Menu.Item key={role}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Menu.Item>
        ))}
      </Menu>
    );
    
    return (
      <Dropdown overlay={menu} placement="bottomRight">
        <Button icon={<UserOutlined />}>
          Viewing as: {currentViewRole.charAt(0).toUpperCase() + currentViewRole.slice(1)}
        </Button>
      </Dropdown>
    );
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id) => <span style={{ fontWeight: 'bold' }}>{id}</span>
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: isManagerView ? (text, record) => (
        <Button type="link" onClick={() => navigate(`/promotions/${record.id}`)}>
          {text}
        </Button>
      ) : (text) => text,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => type === 'automatic' ? 'Automatic' : 'One-Time'
    },
    ...(isManagerView ? [{
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (text) => dayjs(text).format('MMM D, YYYY h:mm A')
    }] : []),
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (text) => dayjs(text).format('MMM D, YYYY h:mm A')
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const now = dayjs();
        const start = dayjs(record.startTime);
        const end = dayjs(record.endTime);
        
        let status = 'Not Started';
        let color = 'orange';
        
        if (now.isAfter(start)) {
          status = now.isBefore(end) ? 'Active' : 'Ended';
          color = now.isBefore(end) ? 'green' : 'red';
        }
        
        return <span style={{ color, fontWeight: 'bold' }}>{status}</span>;
      }
    },
  ];

  return (
    <div>
      <NavBar>
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2>Promotions</h2>
              <Space>
                {renderRoleDropdown()}
                <Button 
                  icon={<SyncOutlined />} 
                  onClick={fetchPromotions}
                  loading={loading}
                >
                  Refresh
                </Button>
                {isManagerView && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/promotions/new')}
                  >
                    Create Promotion
                  </Button>
                )}
              </Space>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
              <Search
                placeholder="Search by name"
                allowClear
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                style={{ width: 200 }}
              />
              <Select
                placeholder="Type"
                value={filters.type || undefined}
                onChange={(value) => handleFilterChange('type', value)}
                style={{ width: 120 }}
                allowClear
              >
                <Option value="automatic">Automatic</Option>
                <Option value="one-time">One-Time</Option>
              </Select>
              {isManagerView && (
                <>
                  <Select
                    placeholder="Start Status"
                    value={filters.started || undefined}
                    onChange={(value) => handleFilterChange('started', value)}
                    style={{ width: 140 }}
                    allowClear
                  >
                    <Option value="true">Started</Option>
                    <Option value="false">Not Started</Option>
                  </Select>
                  <Select
                    placeholder="End Status"
                    value={filters.ended || undefined}
                    onChange={(value) => handleFilterChange('ended', value)}
                    style={{ width: 140 }}
                    allowClear
                  >
                    <Option value="true">Ended</Option>
                    <Option value="false">Not Ended</Option>
                  </Select>
                </>
              )}
            </div>

            <Table
              columns={columns}
              dataSource={promotions}
              rowKey="id"
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                pageSizeOptions: ['5', '10', '20', '50'],
                showTotal: (total) => `Total ${total} items`
              }}
              onChange={handleTableChange}
            />
          </Card>
        </div>
      </NavBar>
    </div>
  );
};

export default PromotionList;
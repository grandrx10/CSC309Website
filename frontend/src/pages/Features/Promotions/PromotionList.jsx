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
  const [pendingSearch, setPendingSearch] = useState('');
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
        // Only include started/ended if manager view
        ...(isManagerView && {
          started: params.get('started') || undefined,
          ended: params.get('ended') || undefined
        })
      }
    };
  };

  const [pagination, setPagination] = useState(initialParams().pagination);
  const [filters, setFilters] = useState(initialParams().filters);

  // Update URL with current state
  const updateURL = useCallback((newPagination, newFilters) => {
    const params = new URLSearchParams();
    
    params.set('page', newPagination.current);
    params.set('limit', newPagination.pageSize);
    
    if (newFilters.name) params.set('name', newFilters.name);
    if (newFilters.type) params.set('type', newFilters.type);
    
    // Only include started/ended for manager views
    if (isManagerView) {
      if (newFilters.started !== undefined) params.set('started', newFilters.started);
      if (newFilters.ended !== undefined) params.set('ended', newFilters.ended);
    }
    
    navigate({ search: params.toString() }, { replace: true });
  }, [navigate, isManagerView]);

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
  
      // Add filters
      if (filters.name) {
        params.set('name', filters.name);
      }
      
      if (filters.type) {
        params.set('type', filters.type);
      }
      
      // For non-manager views, only show active promotions
      if (!isManagerView) {
        // Only send one parameter - either started or ended
        params.set('active', 'true');
      } 
      // For manager views, include their selected filters
      else {
        // Only include one time-based filter at a time
        if (filters.started !== undefined) {
          params.set('started', filters.started);
        } else if (filters.ended !== undefined) {
          params.set('ended', filters.ended);
        }
      }
  
      const response = await fetch(`${API_URL}/promotions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch promotions');
      }
      
      const data = await response.json();
      
      setPromotions(data.results || []);
      setPagination(prev => ({ 
        ...prev, 
        total: data.count || 0 
      }));
    } catch (err) {
      console.error('Error fetching promotions:', err);
      message.error(err.message || 'Failed to load promotions');
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters, isManagerView]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleFilterChange = (name, value) => {
    const newFilters = { 
      ...filters, 
      [name]: value === '' ? undefined : value 
    };
    setFilters(newFilters);
    setPendingSearch(name === 'name' ? value : pendingSearch);
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
    
    // Reset filters when changing role
    const newFilters = {
      name: filters.name || '',
      type: filters.type || '',
      // Only include started/ended for manager views
      ...(isManagerView && {
        started: undefined,
        ended: undefined
      })
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
      render: (text, record) => isManagerView ? (
        <Button type="link" onClick={() => navigate(`/promotions/${record.id}`)}>
          {text}
        </Button>
      ) : (
        <span>{text}</span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => type === 'automatic' ? 'Automatic' : 'One-Time'
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (text) => dayjs(text).format('MMM D, YYYY h:mm A')
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (text) => dayjs(text).format('MMM D, YYYY h:mm A')
    },
    {
      title: 'Min Spending',
      dataIndex: 'minSpending',
      key: 'minSpending',
      render: (value) => value ? `$${value.toFixed(2)}` : 'N/A'
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      render: (value) => value ? `${(value * 100).toFixed(0)}%` : 'N/A'
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
        
        // For non-manager views, all promotions should be active
        if (!isManagerView) {
          status = 'Active';
          color = 'green';
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
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                onSearch={(value) => handleFilterChange('name', value)}
                style={{ width: 200 }}
                enterButton
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
                    value={filters.started}
                    onChange={(value) => handleFilterChange('started', value)}
                    style={{ width: 140 }}
                    allowClear
                  >
                    <Option value="true">Started</Option>
                    <Option value="false">Not Started</Option>
                  </Select>
                  <Select
                    placeholder="End Status"
                    value={filters.ended}
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
              dataSource={promotions} // Show all promotions from API (filtering done server-side)
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
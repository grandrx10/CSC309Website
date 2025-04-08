import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Select, Space, Card, message } from 'antd';
import { PlusOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import NavBar from '../../../components/NavBar';

const { Search } = Input;
const { Option } = Select;

const PromotionList = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    name: '',
    type: '',
    started: '',
    ended: ''
  });
  const navigate = useNavigate();

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: pagination.current,
        limit: pagination.pageSize,
        ...(filters.name && { name: filters.name }),
        ...(filters.type && { type: filters.type }),
        ...(filters.started && { started: filters.started }),
        ...(filters.ended && { ended: filters.ended })
      });

      const response = await fetch(`http://localhost:3100/promotions?${params.toString()}`, {
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
  }, [pagination.current, pagination.pageSize, filters]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Button type="link" onClick={() => navigate(`/promotions/${record.id}`)}>
          {text}
        </Button>
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
                <Button 
                    icon={<SyncOutlined />} 
                    onClick={fetchPromotions}
                    loading={loading}
                >
                    Refresh
                </Button>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/promotions/new')}
                >
                    Create Promotion
                </Button>
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
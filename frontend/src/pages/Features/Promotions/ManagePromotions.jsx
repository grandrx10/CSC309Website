import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Table, Input, Select, DatePicker, Card, Descriptions, Form, InputNumber, Modal, message, Space } from 'antd';import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import NavBar from '../../../components/NavBar';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const ManagePromotions = () => {
  const navigate = useNavigate();
  const { promotionId } = useParams();
  const [promotions, setPromotions] = useState([]);
  const [currentPromotion, setCurrentPromotion] = useState(null);
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
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  useEffect(() => {
    if (promotionId && promotionId !== 'new') {
      fetchPromotionDetails(promotionId);
    } else {
      fetchPromotions();
    }
  }, [promotionId, pagination.current, pagination.pageSize, filters]);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
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
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch promotions');
      
      const data = await response.json();
      setPromotions(data.results);
      setPagination(prev => ({ ...prev, total: data.count }));
    } catch (error) {
      console.error('Error fetching promotions:', error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotionDetails = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3100/promotions/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch promotion details');
      
      const data = await response.json();
      setCurrentPromotion(data);
      form.setFieldsValue({
        name: data.name,
        description: data.description,
        type: data.type,
        startTime: dayjs(data.startTime),
        endTime: dayjs(data.endTime),
        minSpending: data.minSpending,
        rate: data.rate,
        points: data.points
      });
    } catch (error) {
      console.error('Error fetching promotion details:', error);
      message.error(error.message);
      navigate('/promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromotion = async (values) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3100/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...values,
          startTime: values.startTime.toISOString(),
          endTime: values.endTime.toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to create promotion');
      
      const data = await response.json();
      message.success('Promotion created successfully');
      navigate(`/promotions/${data.id}`);
    } catch (error) {
      console.error('Error creating promotion:', error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePromotion = async (values) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3100/promotions/${promotionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...values,
          startTime: values.startTime.toISOString(),
          endTime: values.endTime.toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to update promotion');
      
      message.success('Promotion updated successfully');
      setEditing(false);
      fetchPromotionDetails(promotionId);
    } catch (error) {
      console.error('Error updating promotion:', error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePromotion = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3100/promotions/${promotionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete promotion');
      
      message.success('Promotion deleted successfully');
      navigate('/promotions');
    } catch (error) {
      console.error('Error deleting promotion:', error);
      message.error(error.message);
    } finally {
      setLoading(false);
      setDeleteConfirmVisible(false);
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const promotionColumns = [
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
      title: 'Min Spending',
      dataIndex: 'minSpending',
      key: 'minSpending',
      render: (text) => text ? `$${text.toFixed(2)}` : '-'
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      render: (text) => text ? `${(text * 100).toFixed(0)}%` : '-'
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      render: (text) => text || '-'
    },
  ];

  const renderPromotionsList = () => (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2>Promotions</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/promotions/new')}
        >
          Create Promotion
        </Button>
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
        <Button onClick={fetchPromotions}>Search</Button>
      </div>

      <Table
        columns={promotionColumns}
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
    </div>
  );

  const renderPromotionDetails = () => (
    <div style={{ padding: '24px' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/promotions')}
        style={{ marginBottom: '16px' }}
      >
        Back
      </Button>

      <Card
        title={currentPromotion.name}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => setDeleteConfirmVisible(true)}
            >
              Delete
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Description">{currentPromotion.description}</Descriptions.Item>
          <Descriptions.Item label="Type">
            {currentPromotion.type === 'automatic' ? 'Automatic' : 'One-Time'}
          </Descriptions.Item>
          <Descriptions.Item label="Start Time">
            {dayjs(currentPromotion.startTime).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="End Time">
            {dayjs(currentPromotion.endTime).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Min Spending">
            {currentPromotion.minSpending ? `$${currentPromotion.minSpending.toFixed(2)}` : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Rate">
            {currentPromotion.rate ? `${(currentPromotion.rate * 100).toFixed(0)}%` : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Points">
            {currentPromotion.points || 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );

  const renderPromotionForm = (isEdit) => (
    <div style={{ padding: '24px' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => isEdit ? navigate(`/promotions/${promotionId}`) : navigate('/promotions')}
        style={{ marginBottom: '16px' }}
      >
        Back
      </Button>

      <Card title={isEdit ? 'Edit Promotion' : 'Create New Promotion'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={isEdit ? handleUpdatePromotion : handleCreatePromotion}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input promotion name!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please input promotion description!' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select promotion type!' }]}
          >
            <Select>
              <Option value="automatic">Automatic</Option>
              <Option value="one-time">One-Time</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="startTime"
            label="Start Time"
            rules={[{ required: true, message: 'Please select start time!' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="endTime"
            label="End Time"
            rules={[{ required: true, message: 'Please select end time!' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="minSpending"
            label="Minimum Spending (optional)"
          >
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="rate"
            label="Discount Rate (optional)"
          >
            <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="points"
            label="Points (optional)"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEdit ? 'Update Promotion' : 'Create Promotion'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );

  const renderContent = () => {
    if (promotionId === 'new') {
      return renderPromotionForm(false);
    } else if (editing) {
      return renderPromotionForm(true);
    } else if (promotionId) {
      return renderPromotionDetails();
    } else {
      return renderPromotionsList();
    }
  };

  return (
    <div>
      <NavBar />
      {loading && <div style={{ textAlign: 'center', padding: '24px' }}>Loading...</div>}
      {!loading && renderContent()}

      <Modal
        title="Confirm Delete"
        visible={deleteConfirmVisible}
        onOk={handleDeletePromotion}
        onCancel={() => setDeleteConfirmVisible(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this promotion? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default ManagePromotions;
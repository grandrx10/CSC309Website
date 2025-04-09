import { Table, Button, Space, message, Form, Input, Modal, Typography, Row, Col, Card } from 'antd';
import { UserAddOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

const { Title } = Typography;
require('dotenv').config()
const API_URL =  process.env.REACT_APP_API_URL || "http://localhost:3100";
const EventOrganizers = ({ eventId, canManageOrganizers }) => {
  const [organizers, setOrganizers] = useState([]);
  const [loading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchOrganizers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(API_URL + `/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) throw new Error('Failed to fetch event details');
      
      const data = await response.json();
      setOrganizers(data.organizers || []);
    } catch (error) {
      message.error(error.message);
    }
  };

  const addOrganizer = async (utorid) => {
    if (!canManageOrganizers) {
      message.error('You do not have permission to add organizers');
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(API_URL + `/events/${eventId}/organizers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ utorid })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add organizer');
      }
  
      const data = await response.json();
      
      // Find the newly added organizer (last one in the array)
      const newOrganizer = data.organizers[data.organizers.length - 1];
      
      message.success(`${newOrganizer.name} added as organizer`);
      setModalVisible(false);  // This should close the modal
      form.resetFields();
      fetchOrganizers();  // This will refresh the list
    } catch (error) {
      message.error(error.message);
    }
  };

  const removeOrganizer = async (organizerId) => {
    if (!canManageOrganizers) {
      message.error('You do not have permission to remove organizers');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(API_URL + `/events/${eventId}/organizers/${organizerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to remove organizer');

      message.success('Organizer removed successfully');
      fetchOrganizers();
    } catch (error) {
      message.error(error.message);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, [eventId]);

  const columns = [
    { 
      title: 'Name', 
      dataIndex: 'name',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    { 
      title: 'UTORid', 
      dataIndex: 'utorid',
      render: (text) => <span style={{ color: '#666' }}>{text}</span>
    },
    ...(canManageOrganizers ? [{
      title: 'Actions',
      width: 100,
      render: (_, organizer) => (
        <Space>
          <Button 
            danger 
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeOrganizer(organizer.id)}
            style={{ borderRadius: 4 }}
          />
        </Space>
      )
    }] : [])
  ];

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>Organizer Management</Title>}
      bordered={false}
      style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
      bodyStyle={{ padding: 24 }}
    >
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space size={8} align="center">
            <Title level={5} style={{ margin: 0 }}>Organizer List</Title>
            <span style={{ 
              backgroundColor: '#f0f0f0',
              borderRadius: 10,
              padding: '2px 8px',
              fontSize: 12,
              fontWeight: 500
            }}>
              {organizers.length} {organizers.length === 1 ? 'organizer' : 'organizers'}
            </span>
          </Space>
        </Col>
        <Col>
          {canManageOrganizers && (
            <Button 
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setModalVisible(true)}
              style={{ borderRadius: 6 }}
            >
              Add Organizer
            </Button>
          )}
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={organizers}
        loading={loading}
        rowKey="id"
        pagination={false}
        style={{ borderRadius: 8 }}
        bordered
      />

      {canManageOrganizers && (
        <Modal
          title={<span style={{ fontSize: 18, fontWeight: 500 }}>Add New Organizer</span>}
          visible={modalVisible}
          onOk={() => form.submit()}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
          }}
          okText="Add Organizer"
          okButtonProps={{ style: { borderRadius: 6 } }}
          cancelButtonProps={{ style: { borderRadius: 6 } }}
        >
          <Form
            form={form}
            onFinish={(values) => addOrganizer(values.utorid)}
            layout="vertical"
            style={{ marginTop: 24 }}
          >
            <Form.Item
              name="utorid"
              label={<span style={{ fontWeight: 500 }}>UTORid</span>}
              rules={[{ required: true, message: 'Please input UTORid!' }]}
            >
              <Input 
                placeholder="e.g. johndoe" 
                style={{ borderRadius: 6 }}
              />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </Card>
  );
};

export default EventOrganizers;
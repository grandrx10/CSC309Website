import { Table, Button, Space, message, Form, Input, Modal, Typography, Row, Col, Card } from 'antd';
import { UserAddOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const { Title } = Typography;

const EventGuests = ({ eventId, canManageGuests }) => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchGuests = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3100/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) throw new Error('Failed to fetch event details');
      
      const data = await response.json();
      setGuests(data.guests || []);
    } catch (error) {
      message.error(error.message);
    }
  };

  const addGuest = async (utorid) => {
    if (!canManageGuests) {
      message.error('You do not have permission to add guests');
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3100/events/${eventId}/guests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ utorid })
      });

      if (!response.ok) throw new Error('Failed to add guest');

      const data = await response.json();
      message.success(`${data.guestAdded.name} added to event`);
      fetchGuests();
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(error.message);
    }
  };

  const removeGuest = async (guestId) => {
    if (!canManageGuests) {
      message.error('You do not have permission to remove guests');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3100/events/${eventId}/guests/${guestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to remove guest');

      message.success('Guest removed successfully');
      fetchGuests();
    } catch (error) {
      message.error(error.message);
    }
  };

  useEffect(() => {
    fetchGuests();
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
    ...(canManageGuests ? [{
      title: 'Actions',
      width: 120,
      render: (_, guest) => (
        <Button 
          danger 
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeGuest(guest.id)}
          style={{ borderRadius: 4 }}
        />
      )
    }] : [])
  ];

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>Guest Management</Title>}
      bordered={false}
      style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
      bodyStyle={{ padding: 24 }}
    >
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space size={8} align="center">
            <Title level={5} style={{ margin: 0 }}>Guest List</Title>
            <span style={{ 
              backgroundColor: '#f0f0f0',
              borderRadius: 10,
              padding: '2px 8px',
              fontSize: 12,
              fontWeight: 500
            }}>
              {guests.length} {guests.length === 1 ? 'guest' : 'guests'}
            </span>
          </Space>
        </Col>
        {canManageGuests && (
          <Col>
            <Button 
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setModalVisible(true)}
              style={{ borderRadius: 6 }}
            >
              Add Guest
            </Button>
          </Col>
        )}
      </Row>

      <Table
        columns={columns}
        dataSource={guests}
        loading={loading}
        rowKey="id"
        pagination={false}
        style={{ borderRadius: 8 }}
        bordered
      />

      {canManageGuests && (
        <Modal
          title={<span style={{ fontSize: 18, fontWeight: 500 }}>Add New Guest</span>}
          visible={modalVisible}
          onOk={() => form.submit()}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
          }}
          okText="Add Guest"
          okButtonProps={{ style: { borderRadius: 6 } }}
          cancelButtonProps={{ style: { borderRadius: 6 } }}
        >
          <Form
            form={form}
            onFinish={(values) => addGuest(values.utorid)}
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

export default EventGuests;
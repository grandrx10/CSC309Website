import { Table, Button, Space, message, Form, Input, Modal, Typography, Row, Col, Card, InputNumber } from 'antd';
import { UserAddOutlined, DeleteOutlined, GiftOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const { Title } = Typography;

const EventGuests = ({ eventId, canManageGuests, canAwardPoints }) => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const [awardAllModalVisible, setAwardAllModalVisible] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [form] = Form.useForm();
  const [awardForm] = Form.useForm();
  const [awardAllForm] = Form.useForm();

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

  const awardPoints = async (values) => {
    if (!canAwardPoints) {
      message.error('You do not have permission to award points');
      return;
    }
  
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3100/events/${eventId}/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: "event",
          utorid: selectedGuest?.utorid,
          amount: values.amount,
          remark: values.remark || undefined
        })
      });
  
      if (!response.ok) throw new Error('Failed to award points');
  
      message.success(`Successfully awarded ${values.amount} points to ${selectedGuest?.name || 'all guests'}`);
      setPointsModalVisible(false);
      setAwardAllModalVisible(false);
      awardForm.resetFields();
      awardAllForm.resetFields();
      
      // Refresh the entire page
      window.location.reload();
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleAwardPoints = (guest) => {
    setSelectedGuest(guest);
    setPointsModalVisible(true);
  };

  const handleAwardAll = () => {
    setSelectedGuest(null);
    setAwardAllModalVisible(true);
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
    ...(canManageGuests || canAwardPoints ? [{
      title: 'Actions',
      width: 150,
      render: (_, guest) => (
        <Space>
          {canAwardPoints && (
            <Button 
              type="primary" 
              size="small"
              icon={<GiftOutlined />}
              onClick={() => handleAwardPoints(guest)}
              style={{ borderRadius: 4 }}
            />
          )}
          {canManageGuests && (
            <Button 
              danger 
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => removeGuest(guest.id)}
              style={{ borderRadius: 4 }}
            />
          )}
        </Space>
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
        <Col>
          <Space>
            {canAwardPoints && (
              <Button 
                type="primary"
                icon={<GiftOutlined />}
                onClick={handleAwardAll}
                style={{ borderRadius: 6 }}
              >
                Award All Guests
              </Button>
            )}
            {canManageGuests && (
              <Button 
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setModalVisible(true)}
                style={{ borderRadius: 6 }}
              >
                Add Guest
              </Button>
            )}
          </Space>
        </Col>
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

      {/* Award Points Modal */}
      {canAwardPoints && (
        <>
          <Modal
            title={<span style={{ fontSize: 18, fontWeight: 500 }}>Award Points to {selectedGuest?.name}</span>}
            visible={pointsModalVisible}
            onOk={() => awardForm.submit()}
            onCancel={() => {
              setPointsModalVisible(false);
              awardForm.resetFields();
            }}
            okText="Award Points"
            okButtonProps={{ style: { borderRadius: 6 } }}
            cancelButtonProps={{ style: { borderRadius: 6 } }}
          >
            <Form
              form={awardForm}
              onFinish={awardPoints}
              layout="vertical"
              style={{ marginTop: 24 }}
            >
              <Form.Item
                name="amount"
                label={<span style={{ fontWeight: 500 }}>Points Amount</span>}
                rules={[{ 
                  required: true, 
                  message: 'Please input points amount!',
                  type: 'number',
                  min: 1,
                  message: 'Points must be a positive integer'
                }]}
              >
                <InputNumber 
                  placeholder="Enter points amount" 
                  style={{ width: '100%', borderRadius: 6 }}
                  min={1}
                  step={1}
                />
              </Form.Item>
              <Form.Item
                name="remark"
                label={<span style={{ fontWeight: 500 }}>Remark (Optional)</span>}
              >
                <Input 
                  placeholder="e.g. Trivia winner" 
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>
            </Form>
          </Modal>

          {/* Award All Guests Modal */}
          <Modal
            title={<span style={{ fontSize: 18, fontWeight: 500 }}>Award Points to All Guests</span>}
            visible={awardAllModalVisible}
            onOk={() => awardAllForm.submit()}
            onCancel={() => {
              setAwardAllModalVisible(false);
              awardAllForm.resetFields();
            }}
            okText="Award to All"
            okButtonProps={{ style: { borderRadius: 6 } }}
            cancelButtonProps={{ style: { borderRadius: 6 } }}
          >
            <Form
              form={awardAllForm}
              onFinish={awardPoints}
              layout="vertical"
              style={{ marginTop: 24 }}
            >
              <Form.Item
                name="amount"
                label={<span style={{ fontWeight: 500 }}>Points Amount</span>}
                rules={[{ 
                  required: true, 
                  message: 'Please input points amount!',
                  type: 'number',
                  min: 1,
                  message: 'Points must be a positive integer'
                }]}
              >
                <InputNumber 
                  placeholder="Enter points amount" 
                  style={{ width: '100%', borderRadius: 6 }}
                  min={1}
                  step={1}
                />
              </Form.Item>
              <Form.Item
                name="remark"
                label={<span style={{ fontWeight: 500 }}>Remark (Optional)</span>}
              >
                <Input 
                  placeholder="e.g. Participation reward" 
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>
            </Form>
          </Modal>
        </>
      )}
    </Card>
  );
};

export default EventGuests;
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Descriptions, Form, Input, InputNumber, DatePicker, Switch, Table, Space, Modal, message } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, UserAddOutlined, UserDeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const Event = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [addGuestVisible, setAddGuestVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch event details
  const fetchEvent = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3100/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch event');
      }

      const data = await response.json();
      setEvent(data);
      form.setFieldsValue({
        name: data.name,
        description: data.description,
        location: data.location,
        dateRange: [dayjs(data.startTime), dayjs(data.endTime)],
        capacity: data.capacity,
        points: data.pointsAwarded,
        published: data.published
      });
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch guests
  const fetchGuests = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`http://localhost:3100/events/${eventId}`, { // Changed from /guests endpoint
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch event details');
    
    const data = await response.json();
    // Check if guests are returned in the event object or as a separate array
    setGuests(data.guests || []); // Use the guests array from the event response
  } catch (error) {
    message.error(error.message);
  }
};

  useEffect(() => {
    fetchEvent();
    fetchGuests();
  }, [eventId]);

  const handleEdit = async (values) => {
    try {
      const token = localStorage.getItem('authToken');
      const payload = {
        ...values,
        startTime: values.dateRange[0].toISOString(),
        endTime: values.dateRange[1].toISOString()
      };
      delete payload.dateRange;

      const response = await fetch(`http://localhost:3100/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to update event');

      const data = await response.json();
      setEvent(data);
      message.success('Event updated successfully');
      setEditing(false);
      fetchEvent();
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3100/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete event');

      message.success('Event deleted successfully');
      navigate('/events');
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleAddGuest = async (utorid) => {
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
      setAddGuestVisible(false);
      fetchGuests();
      fetchEvent();
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleRemoveGuest = async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3100/events/${eventId}/guests/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to remove guest');

      message.success('Guest removed successfully');
      fetchGuests();
      fetchEvent();
    } catch (error) {
      message.error(error.message);
    }
  };

  const guestColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'UTORid',
      dataIndex: 'utorid',
      key: 'utorid'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          danger
          icon={<UserDeleteOutlined />}
          onClick={() => handleRemoveGuest(record.id)}
        />
      )
    }
  ];

  if (loading) return <div>Loading...</div>;
  if (!event) return <div>Event not found</div>;

  return (
    <div style={{ padding: '24px' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: '16px' }}
      >
        Back
      </Button>

      {!editing ? (
        <Card
          title={event.name}
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
            <Descriptions.Item label="Description">{event.description}</Descriptions.Item>
            <Descriptions.Item label="Location">{event.location}</Descriptions.Item>
            <Descriptions.Item label="Start Time">
              {dayjs(event.startTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="End Time">
              {dayjs(event.endTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Capacity">
              {event.capacity || 'No limit'}
            </Descriptions.Item>
            <Descriptions.Item label="Points">
              {event.pointsAwarded}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {event.published ? 'Published' : 'Draft'}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3>Guests ({guests.length})</h3>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setAddGuestVisible(true)}
              >
                Add Guest
              </Button>
            </div>
            <Table
              columns={guestColumns}
              dataSource={guests}
              rowKey="id"
              pagination={false}
            />
          </div>
        </Card>
      ) : (
        <Card
          title="Edit Event"
          extra={
            <Button onClick={() => setEditing(false)}>
              Cancel
            </Button>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleEdit}
          >
            <Form.Item
              name="name"
              label="Event Name"
              rules={[{ required: true, message: 'Please input event name!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name="location"
              label="Location"
              rules={[{ required: true, message: 'Please input location!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="dateRange"
              label="Date & Time"
              rules={[{ required: true, message: 'Please select date range!' }]}
            >
              <RangePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="capacity"
              label="Capacity (leave empty for no limit)"
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="points"
              label="Points"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="published"
              label="Published"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Save Changes
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* Add Guest Modal */}
      <Modal
        title="Add Guest"
        visible={addGuestVisible}
        onCancel={() => setAddGuestVisible(false)}
        footer={null}
      >
        <Form
          onFinish={(values) => handleAddGuest(values.utorid)}
        >
          <Form.Item
            name="utorid"
            label="UTORid"
            rules={[{ required: true, message: 'Please input UTORid!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        visible={deleteConfirmVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this event? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Event;
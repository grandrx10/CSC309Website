import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message, Form, Input, DatePicker, Switch, Button, Card, InputNumber, Skeleton } from 'antd';
import dayjs from 'dayjs';
import NavBar from '../../NavBar';
require('dotenv').config()
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const API_URL =  process.env.REACT_APP_API_URL || "http://localhost:3100"; 
const EditEvent = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();

  // Fetch event data
  const fetchEvent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      // Get current user info
      const userResponse = await fetch(API_URL + '/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!userResponse.ok) {
        if (userResponse.status === 401) navigate('/login');
        throw new Error('Failed to fetch user information');
      }
      
      const userData = await userResponse.json();
      setCurrentUser(userData);
      
      // Get event data
      const eventResponse = await fetch(API_URL + `/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!eventResponse.ok) {
        if (eventResponse.status === 401) navigate('/login');
        throw new Error('Failed to fetch event');
      }

      const eventData = await eventResponse.json();
      setEvent(eventData);
      form.setFieldsValue({
        name: eventData.name,
        description: eventData.description,
        location: eventData.location,
        dateRange: [dayjs(eventData.startTime), dayjs(eventData.endTime)],
        capacity: eventData.capacity,
        points: eventData.pointsRemain,
        published: eventData.published
      });
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is a manager or superuser
  const isManagerOrSuperuser = () => {
    return currentUser?.role && ['manager', 'superuser'].includes(currentUser.role.toLowerCase());
  };

  // Update event
  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem('authToken');
      const payload = {
        ...values,
        startTime: values.dateRange[0].toISOString(),
        endTime: values.dateRange[1].toISOString()
      };
      delete payload.dateRange;

      // If user is not manager/superuser, ensure we don't modify restricted fields
      if (!isManagerOrSuperuser()) {
        // Preserve original values for restricted fields
        payload.pointsAwarded = event.pointsAwarded;
        payload.published = event.published;
      }

      const response = await fetch(API_URL + `/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to update event');

      message.success('Event updated successfully');
      navigate(`/events/${eventId}`); // Return to view page after save
    } catch (error) {
      message.error(error.message);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <NavBar>
        <div className="event-loading-container">
          <Skeleton active paragraph={{ rows: 8 }} />
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      </NavBar>
    );
  }
  if (!event) return <div>Event not found</div>;

  return (
    <NavBar>
    <Card
      title="Edit Event"
      extra={
        <Button onClick={() => navigate(`/events/${eventId}`)}>
          Cancel
        </Button>
      }
      style={{ margin: 16 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
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

        {/* Only show Points field for managers/superusers */}
        {isManagerOrSuperuser() && (
          <Form.Item
            name="points"
            label="Awardable Points"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        )}

        {/* Only show Published field for managers/superusers AND if event is not already published */}
        {isManagerOrSuperuser() && !event.published && (
          <Form.Item
            name="published"
            label="Published"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </Card>
    
    </NavBar>
  );
};

export default EditEvent;
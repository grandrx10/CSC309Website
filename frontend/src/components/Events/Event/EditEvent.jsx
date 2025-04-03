import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message, Form, Input, DatePicker, Switch, Button, Card, InputNumber } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const EditEvent = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();

  // Fetch event data
  const fetchEvent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3100/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) navigate('/login');
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

      const response = await fetch(`http://localhost:3100/events/${eventId}`, {
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

  if (loading) return <div>Loading...</div>;
  if (!event) return <div>Event not found</div>;

  return (
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

        <Form.Item
          name="points"
          label="Points Awarded"
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
  );
};

export default EditEvent;
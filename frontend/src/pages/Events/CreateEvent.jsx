import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, DatePicker, InputNumber, message } from 'antd';
import dayjs from 'dayjs';
import styles from './CreateEvent.module.css';

const { TextArea } = Input;
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";

const CreateEvent = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
        const response = await fetch(API_URL + '/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`  // Added auth header
            },
            body: JSON.stringify({
                name: values.name,               // Explicitly list properties instead of ...values
                description: values.description, // to ensure only needed data is sent
                location: values.location,
                startTime: values.dateRange[0].toISOString(),
                endTime: values.dateRange[1].toISOString(),
                capacity: values.capacity || null,  // Ensure null if not provided
                points: values.points
            }),
        });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      const data = await response.json();
      message.success('Event created successfully!');
      navigate(`/events/${data.id}`);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Create New Event</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className={styles.form}
      >
        <Form.Item
          name="name"
          label="Event Name"
          rules={[{ required: true, message: 'Please input the event name!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please input the event description!' }]}
        >
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item
          name="location"
          label="Location"
          rules={[{ required: true, message: 'Please input the event location!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="Event Time"
          rules={[{ required: true, message: 'Please select the event time range!' }]}
        >
          <DatePicker.RangePicker
            showTime
            style={{ width: '100%' }}
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Form.Item
          name="capacity"
          label="Capacity (optional)"
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="points"
          label="Points"
          rules={[{ required: true, message: 'Please input the points amount!' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Event
          </Button>
          <Button onClick={() => navigate('/events')} style={{ marginLeft: 8 }}>
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default CreateEvent;
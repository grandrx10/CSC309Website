import { Form, Input, DatePicker, Switch, Button, Card, Alert } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const EventForm = ({ event, onSubmit, onCancel, isManagerOrSuperuser }) => {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    // Filter out restricted fields if not manager/superuser
    const payload = isManagerOrSuperuser ? values : {
      ...values,
      published: undefined, // Remove published field
      pointsAwarded: undefined, // Remove points field
      pointsRemain: undefined
    };
    onSubmit(payload);
  };

  return (
    <Card
      title={event ? 'Edit Event' : 'Create Event'}
      extra={<Button onClick={onCancel}>Cancel</Button>}
    >
      {!isManagerOrSuperuser && (
        <Alert
          message="Note: As an organizer, you can't modify publication status or points values"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Form
        form={form}
        initialValues={{
          ...event,
          dateRange: event ? [dayjs(event.startTime), dayjs(event.endTime)] : null
        }}
        onFinish={onFinish}
      >
        {/* Basic fields */}
        <Form.Item label="Event Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        
        <Form.Item label="Description" name="description">
          <TextArea />
        </Form.Item>
        
        <Form.Item label="Location" name="location" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        
        <Form.Item label="Time Range" name="dateRange" rules={[{ required: true }]}>
          <RangePicker showTime format="YYYY-MM-DD HH:mm" />
        </Form.Item>
        
        {/* Manager-only fields */}
        {isManagerOrSuperuser && (
          <>
            <Form.Item label="Published" name="published" valuePropName="checked">
              <Switch />
            </Form.Item>
            
            <Form.Item label="Points Awarded" name="pointsAwarded">
              <Input type="number" min={0} disabled={!isManagerOrSuperuser} />
            </Form.Item>
          </>
        )}
        
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EventForm;
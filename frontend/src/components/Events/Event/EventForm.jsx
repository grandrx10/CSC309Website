import { Form, Input, DatePicker, Switch, Button, Card } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const EventForm = ({ event, onSubmit, onCancel }) => {
  const [form] = Form.useForm();

  return (
    <Card
      title={event ? 'Edit Event' : 'Create Event'}
      extra={<Button onClick={onCancel}>Cancel</Button>}
    >
      <Form
        form={form}
        initialValues={{
          ...event,
          dateRange: event ? [dayjs(event.startTime), dayjs(event.endTime)] : null
        }}
        onFinish={onSubmit}
      >
        {/* Form fields here */}
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
import { Descriptions, Space, Card } from 'antd';
import dayjs from 'dayjs';
import PageHeader from '../Shared/PageHeader';
import ActionButtons from '../Shared/ActionButtons';
import EventGuests from './EventGuests';

const EventDetails = ({ event, onEdit, onDelete }) => {
  return (
    <div style={{ padding: '24px' }}>
      <Card
        bordered={false}
        style={{
          borderRadius: 8,
          marginBottom: 24,
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
        }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: '24px 24px 0 24px' }}>
          <PageHeader 
            title={event.name}
            onBack={() => window.history.back()}
            extra={
              <ActionButtons
                onEdit={onEdit}
                onDelete={onDelete}
              />
            }
          />
        </div>

        <div style={{ padding: '0 24px 24px 24px' }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Description">{event.description}</Descriptions.Item>
            <Descriptions.Item label="Location">{event.location}</Descriptions.Item>
            <Descriptions.Item label="Time">
              {dayjs(event.startTime).format('MMM D, YYYY h:mm A')} - 
              {dayjs(event.endTime).format('h:mm A')}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <span style={{ 
                color: event.published ? '#389e0d' : '#d48806',
                fontWeight: 500
              }}>
                {event.published ? 'Published' : 'Draft'}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </div>
      </Card>

      <EventGuests eventId={event.id} />
    </div>
  );
};

export default EventDetails;
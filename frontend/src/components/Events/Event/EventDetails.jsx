import { Descriptions, Card, Tag } from 'antd';
import dayjs from 'dayjs';
import PageHeader from '../Shared/PageHeader';
import ActionButtons from '../Shared/ActionButtons';
import EventGuests from './EventGuests';
import { useNavigate } from 'react-router-dom';

const EventDetails = ({ 
  event, 
  onEdit, 
  onDelete, 
  showGuestManagement, 
  showStatus, 
  currentUser,
  currentViewRole 
}) => {
  const navigate = useNavigate();

  // Check if delete button should be shown based on current view role
  const showDeleteButton = () => {
    if (!onDelete) return false;
    if (event.published) return false;
    return ['manager', 'superuser'].includes(currentViewRole);
  };

  // Check if edit button should be shown based on current view role
  const showEditButton = () => {
    if (!onEdit) return false;
    if (['manager', 'superuser'].includes(currentViewRole)) {
      return true;
    }
    return event.organizers && event.organizers.some(organizer => 
      organizer.utorid === currentUser?.utorid
    );
  };

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
            onBack={() => navigate('/events')}
            extra={
              <ActionButtons
                onEdit={showEditButton() ? onEdit : undefined}
                onDelete={showDeleteButton() ? onDelete : undefined}
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
            {showStatus && (
              <Descriptions.Item label="Status">
                <span style={{ 
                  color: event.published ? '#389e0d' : '#d48806',
                  fontWeight: 500
                }}>
                  {event.published ? 'Published' : 'Draft'}
                </span>
              </Descriptions.Item>
            )}
            {showStatus && (
              <>
                <Descriptions.Item label="Points Remaining">
                  <Tag color="blue" style={{ fontSize: 14, padding: '4px 8px' }}>
                    {event.pointsRemain}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Points Awarded">
                  <Tag color="green" style={{ fontSize: 14, padding: '4px 8px' }}>
                    {event.pointsAwarded}
                  </Tag>
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        </div>
      </Card>

      {showGuestManagement && (
        <EventGuests 
          eventId={event.id} 
          canManageGuests={showGuestManagement}
          canAwardPoints={showGuestManagement}
          canDeleteGuests={['manager', 'superuser'].includes(currentViewRole)}
        />
      )}
    </div>
  );
};

export default EventDetails;
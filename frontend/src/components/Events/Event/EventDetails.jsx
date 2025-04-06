import { Descriptions, Space, Card } from 'antd';
import dayjs from 'dayjs';
import PageHeader from '../Shared/PageHeader';
import ActionButtons from '../Shared/ActionButtons';
import EventGuests from './EventGuests';
import { useNavigate } from 'react-router-dom';

const EventDetails = ({ event, onEdit, onDelete, showGuestManagement, showStatus, currentUser }) => {
  const navigate = useNavigate();
  
  // Check if delete button should be shown
  const showDeleteButton = () => {
    // Don't show if no delete handler provided
    if (!onDelete) return false;
    
    // Don't show for published events
    if (event.published) return false;
    
    // Only show for managers/superusers
    return ['manager', 'superuser'].includes(currentUser?.role.toLowerCase());
  };

  // Check if edit button should be shown
  const showEditButton = () => {
    // Don't show if no edit handler provided
    if (!onEdit) return false;
    // Show for managers/superusers regardless of ownership
    if (['manager', 'superuser'].includes(currentUser?.role.toLowerCase())) {
      return true;
    }
    
    // Show for the event organizer (assuming event.organizerId exists and matches currentUser.id)
    return event.organizers && event.organizers.some(organizer => 
      organizer.utorid === currentUser?.utorid
    );
  };
  console.log(showEditButton())
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
              (showEditButton() || showDeleteButton()) && (
                <ActionButtons
                  onEdit={showEditButton() ? onEdit : null}
                  onDelete={showDeleteButton() ? onDelete : null}
                />
              )
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
          </Descriptions>
        </div>
      </Card>

      {showGuestManagement && (
        <EventGuests 
          eventId={event.id} 
          canManageGuests={['manager', 'superuser'].includes(currentUser?.role.toLowerCase())}
        />
      )}
    </div>
  );
};

export default EventDetails;
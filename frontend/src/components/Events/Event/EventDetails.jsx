import { Descriptions, Card, Tag, Space } from 'antd';
import dayjs from 'dayjs';
import PageHeader from '../Shared/PageHeader';
import ActionButtons from '../Shared/ActionButtons';
import EventGuests from './EventGuests';
import EventOrganizers from './EventOrganizers';
import { useNavigate } from 'react-router-dom';

const EventDetails = ({ 
  event, 
  onEdit, 
  onDelete, 
  onEnroll,
  enrollDisabled,
  showGuestManagement, 
  showStatus, 
  currentUser,
  currentViewRole,
  renderRoleDropdown
}) => {
  const navigate = useNavigate();

  const showDeleteButton = () => {
    if (!onDelete) return false;
    if (event.published) return false;
    return ['manager', 'superuser'].includes(currentViewRole);
  };

  const showEditButton = () => {
    if (!onEdit) return false;
    if (['manager', 'superuser'].includes(currentViewRole)) {
      return true;
    }
    return event.organizers?.some(org => org.utorid === currentUser?.utorid);
  };

  const canManageOrganizers = ['manager', 'superuser'].includes(currentViewRole);

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
              <Space>
                <ActionButtons
                  onEdit={showEditButton() ? onEdit : undefined}
                  onDelete={showDeleteButton() ? onDelete : undefined}
                  onEnroll={onEnroll}
                  enrollDisabled={enrollDisabled}
                />
                {renderRoleDropdown()}
              </Space>
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
            <Descriptions.Item label="Attendance">
              {event.numGuests} / {event.capacity} attendees
              {event.numGuests >= event.capacity && (
                <Tag color="red" style={{ marginLeft: 8 }}>Full</Tag>
              )}
            </Descriptions.Item>
              {showStatus && (
                <>
                  <Descriptions.Item label="Status">
                    <Tag color={event.published ? 'green' : 'orange'}>
                      {event.published ? 'Published' : 'Draft'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Points Available">
                    {event.pointsRemain || '0'}
                  </Descriptions.Item>
                </>
              )}
  </Descriptions>
        </div>
      </Card>

      {canManageOrganizers && (
        <EventOrganizers 
          eventId={event.id} 
          canManageOrganizers={canManageOrganizers}
        />
      )}

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
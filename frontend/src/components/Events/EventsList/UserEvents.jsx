import { useAuth } from '../auth/AuthContext';
import EventsView from './EventsView';

const UserEvents = () => {
  const { user } = useAuth();
  
  // Columns without points/status/actions
  const userColumns = [
    {
      title: 'Event Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => navigate(`/events/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (text) => dayjs(text).format('MMM D, YYYY h:mm A'),
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (text) => dayjs(text).format('MMM D, YYYY h:mm A'),
    }
  ];

  return (
    <EventsView
      variant="user"
      title="Events"
      columns={userColumns}
      showCreateButton={false}
      showStatusFilter={false}
      initialFilters={{ published: true }} // Force only published events
    />
  );
};

export default UserEvents;
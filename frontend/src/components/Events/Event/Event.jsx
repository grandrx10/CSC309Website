import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { message, Skeleton, Button, Dropdown, Menu } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import EventDetails from './EventDetails';
import EventForm from './EventForm';
import NavBar from '../../NavBar';

const ROLE_HIERARCHY = {
  'superuser': ['superuser', 'manager', 'cashier', 'regular'],
  'manager': ['manager', 'cashier', 'regular'],
  'cashier': ['cashier', 'regular'],
  'regular': ['regular']
};

const Event = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentViewRole, setCurrentViewRole] = useState('regular');
  
  const isEditMode = location.pathname.endsWith('/edit');

  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3100/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch user');
      
      const userData = await response.json();
      setCurrentUser(userData);
      
      // Initialize view role from localStorage or use user's actual role
      const savedRole = localStorage.getItem('currentViewRole');
      const userRole = userData.role.toLowerCase();
      const availableRoles = ROLE_HIERARCHY[userRole] || ['regular'];
      
      if (savedRole && availableRoles.includes(savedRole)) {
        setCurrentViewRole(savedRole);
      } else {
        setCurrentViewRole(userRole);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

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
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle role change
  const handleRoleChange = (role) => {
    setCurrentViewRole(role);
    localStorage.setItem('currentViewRole', role);
  };

  // Render role switcher dropdown
  const renderRoleDropdown = () => {
    if (!currentUser) return null;
    
    const userRole = currentUser.role.toLowerCase();
    const availableRoles = ROLE_HIERARCHY[userRole] || ['regular'];
    
    const menu = (
      <Menu onClick={({ key }) => handleRoleChange(key)}>
        {availableRoles.map(role => (
          <Menu.Item key={role}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Menu.Item>
        ))}
      </Menu>
    );
    
    return (
      <Dropdown overlay={menu} placement="bottomRight">
        <Button icon={<UserOutlined />}>
          Viewing as: {currentViewRole.charAt(0).toUpperCase() + currentViewRole.slice(1)}
        </Button>
      </Dropdown>
    );
  };

  // Check if user has edit privileges based on current view role
  const hasEditPrivileges = () => {
    if (!currentUser || !event) return false;
    
    if (['manager', 'superuser'].includes(currentViewRole)) {
      return true;
    }
    
    return event.organizers?.some(org => org.utorid === currentUser.utorid);
  };

  // Check if user can manage guests based on current view role
  const canManageGuests = () => {
    if (!currentUser) return false;
    
    return ['manager', 'superuser'].includes(currentViewRole) || 
           event.organizers?.some(org => org.utorid === currentUser.utorid);
  };

  // Update event
  const updateEvent = async (values) => {
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

      const data = await response.json();
      setEvent(data);
      message.success('Event updated successfully');
      navigate(`/events/${eventId}`);
    } catch (error) {
      message.error(error.message);
      throw error;
    }
  };

  // Delete event
  const deleteEvent = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3100/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete event');

      message.success('Event deleted successfully');
      navigate('/events');
    } catch (error) {
      message.error(error.message);
      throw error;
    }
  };

  useEffect(() => {
    fetchCurrentUser();
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

  const handleJoinEvent = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3100/events/${eventId}/guests/me`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        if (response.status === 400) throw new Error('You are already registered');
        if (response.status === 404) throw new Error('Event not found');
        if (response.status === 410) throw new Error('Event is full or ended');
        throw new Error('Failed to join event');
      }
  
      const data = await response.json();
      setEvent(prev => ({
        ...prev,
        numGuests: data.numGuests
      }));
      message.success('Successfully joined the event!');

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      message.error(error.message);
    }
  };
  


  return isEditMode ? (
    <NavBar>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px 0 0' }}>
        {renderRoleDropdown()}
      </div>
      <EventForm 
        event={event}
        onCancel={() => navigate(`/events/${eventId}`)}
        onSubmit={updateEvent}
        isManagerOrSuperuser={['manager', 'superuser'].includes(currentViewRole)}
      />
    </NavBar>
  ) : (
    <NavBar>
      <EventDetails 
  event={event}
  onEdit={hasEditPrivileges() ? () => navigate(`/events/${eventId}/edit`) : null}
  onDelete={hasEditPrivileges() ? deleteEvent : null}
  onEnroll={handleJoinEvent}
  enrollDisabled={!event.published || event.numGuests >= event.capacity}
  showGuestManagement={canManageGuests()}
  showStatus={hasEditPrivileges()}
  currentUser={currentUser}
  currentViewRole={currentViewRole}
  renderRoleDropdown={renderRoleDropdown} // Pass the dropdown render function
/>
    </NavBar>
  );
};

export default Event;
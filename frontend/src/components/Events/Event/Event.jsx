import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import EventDetails from './EventDetails';
import EventForm from './EventForm';
import dayjs from 'dayjs';

const Event = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
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

  // Check if user has edit privileges
  const hasEditPrivileges = () => {
    if (!currentUser || !event) return false;
    console.log(currentUser);
    // Managers and superusers can always edit
    if (['manager', 'superuser'].includes(currentUser.role.toLowerCase())) {
      return true;
    }
    console.log(event.organizers?.some(org => org.utorid === currentUser.utorid))
    // Check if current user is an organizer
    return event.organizers?.some(org => org.utorid === currentUser.utorid);
  };

  // Check if user can manage guests
  const canManageGuests = () => {
    if (!currentUser) return false;
    
    // Managers, superusers, and organizers can manage guests
    return ['manager', 'superuser'].includes(currentUser.role.toLowerCase()) || 
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

  if (loading) return <div>Loading...</div>;
  if (!event) return <div>Event not found</div>;

  return isEditMode ? (
    <EventForm 
    event={event}
    onCancel={() => navigate(`/events/${eventId}`)}
    onSubmit={updateEvent}
    isManagerOrSuperuser={['manager', 'superuser'].includes(currentUser?.role.toLowerCase())}
  />
  ) : (
    <EventDetails 
      event={event}
      onEdit={hasEditPrivileges() ? () => navigate(`/events/${eventId}/edit`) : null}
      onDelete={hasEditPrivileges() ? deleteEvent : null}
      showGuestManagement={canManageGuests()}
      showStatus={['manager', 'superuser'].includes(currentUser?.role.toLowerCase())}
      currentUser={currentUser}
    /> 
  );
};

export default Event;
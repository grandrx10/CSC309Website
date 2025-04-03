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
  const [loading, setLoading] = useState(true);
  
  // Determine edit mode from URL
  const isEditMode = location.pathname.endsWith('/edit');

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
      navigate(`/events/${eventId}`); // Go back to view mode after save
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
    fetchEvent();
  }, [eventId]);

  if (loading) return <div>Loading...</div>;
  if (!event) return <div>Event not found</div>;

  return isEditMode ? (
    <EventForm 
      event={event}
      onCancel={() => navigate(`/events/${eventId}`)}
      onSubmit={updateEvent}
    />
  ) : (
    <EventDetails 
      event={event}
      onEdit={() => navigate(`/events/${eventId}/edit`)}
      onDelete={deleteEvent}
    />
  );
};

export default Event;
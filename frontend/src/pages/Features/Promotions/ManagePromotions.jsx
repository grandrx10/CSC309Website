import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavBar from '../../../components/NavBar';

const ManagePromotions = () => {
  const navigate = useNavigate();
  const { promotionId } = useParams();
  const [promotions, setPromotions] = useState([]);
  const [currentPromotion, setCurrentPromotion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    name: '',
    type: '',
    started: '',
    ended: ''
  });

  useEffect(() => {
    if (promotionId) {
      fetchPromotionDetails(promotionId);
    } else {
      fetchPromotions();
    }
  }, [promotionId, page, limit, filters]);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...(filters.name && { name: filters.name }),
        ...(filters.type && { type: filters.type }),
        ...(filters.started && { started: filters.started }),
        ...(filters.ended && { ended: filters.ended })
      }).toString();

      const response = await fetch(`http://localhost:3100/promotions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch promotions');
      
      const data = await response.json();
      setPromotions(data.results);
      setTotal(data.count);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotionDetails = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3100/promotions/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch promotion details');
      
      const data = await response.json();
      setCurrentPromotion(data);
    } catch (error) {
      console.error('Error fetching promotion details:', error);
      navigate('/promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromotion = async (formData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3100/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create promotion');
      
      const data = await response.json();
      navigate(`/promotions/${data.id}`);
    } catch (error) {
      console.error('Error creating promotion:', error);
    }
  };

  const handleUpdatePromotion = async (id, formData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3100/promotions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update promotion');
      
      fetchPromotionDetails(id); // Refresh the promotion details
    } catch (error) {
      console.error('Error updating promotion:', error);
    }
  };

  const handleDeletePromotion = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3100/promotions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete promotion');
      
      navigate('/promotions');
    } catch (error) {
      console.error('Error deleting promotion:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const renderPromotionsList = () => (
    <div>
      <h2>Promotions List</h2>
      
      {/* Filters */}
      <div style={{ marginBottom: '20px' }}>
        <input
          name="name"
          placeholder="Search by name"
          value={filters.name}
          onChange={handleFilterChange}
        />
        <select
          name="type"
          value={filters.type}
          onChange={handleFilterChange}
          style={{ marginLeft: '10px' }}
        >
          <option value="">All Types</option>
          <option value="automatic">Automatic</option>
          <option value="one-time">One-Time</option>
        </select>
        <select
          name="started"
          value={filters.started}
          onChange={handleFilterChange}
          style={{ marginLeft: '10px' }}
        >
          <option value="">All Statuses</option>
          <option value="true">Started</option>
          <option value="false">Not Started</option>
        </select>
        <select
          name="ended"
          value={filters.ended}
          onChange={handleFilterChange}
          style={{ marginLeft: '10px' }}
        >
          <option value="">All Statuses</option>
          <option value="true">Ended</option>
          <option value="false">Not Ended</option>
        </select>
      </div>

      {/* Promotions Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Type</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Start Time</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>End Time</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {promotions.map(promo => (
            <tr key={promo.id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{promo.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{promo.type}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {new Date(promo.startTime).toLocaleString()}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {new Date(promo.endTime).toLocaleString()}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                <button onClick={() => navigate(`/promotions/${promo.id}`)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ marginTop: '20px' }}>
        <button 
          disabled={page === 1} 
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </button>
        <span style={{ margin: '0 10px' }}>Page {page}</span>
        <button 
          disabled={page * limit >= total} 
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
        <select 
          value={limit} 
          onChange={(e) => setLimit(Number(e.target.value))}
          style={{ marginLeft: '10px' }}
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
        </select>
      </div>

      {/* Create New Promotion Button */}
      <button 
        onClick={() => navigate('/promotions/new')}
        style={{ marginTop: '20px' }}
      >
        Create New Promotion
      </button>
    </div>
  );

  const renderPromotionDetails = () => (
    <div>
      <h2>Promotion Details</h2>
      {currentPromotion && (
        <div>
          <div>
            <strong>Name:</strong> {currentPromotion.name}
          </div>
          <div>
            <strong>Description:</strong> {currentPromotion.description}
          </div>
          <div>
            <strong>Type:</strong> {currentPromotion.type}
          </div>
          <div>
            <strong>Start Time:</strong> {new Date(currentPromotion.startTime).toLocaleString()}
          </div>
          <div>
            <strong>End Time:</strong> {new Date(currentPromotion.endTime).toLocaleString()}
          </div>
          <div>
            <strong>Min Spending:</strong> {currentPromotion.minSpending || 'N/A'}
          </div>
          <div>
            <strong>Rate:</strong> {currentPromotion.rate || 'N/A'}
          </div>
          <div>
            <strong>Points:</strong> {currentPromotion.points || 'N/A'}
          </div>

          <div style={{ marginTop: '20px' }}>
            <button onClick={() => navigate('/promotions')}>Back to List</button>
            <button 
              onClick={() => navigate(`/promotions/${promotionId}/edit`)}
              style={{ marginLeft: '10px' }}
            >
              Edit
            </button>
            <button 
              onClick={() => handleDeletePromotion(promotionId)}
              style={{ marginLeft: '10px', color: 'red' }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderCreatePromotion = () => (
    <div>
      <h2>Create New Promotion</h2>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = {
          name: e.target.name.value,
          description: e.target.description.value,
          type: e.target.type.value,
          startTime: e.target.startTime.value,
          endTime: e.target.endTime.value,
          minSpending: e.target.minSpending.value || null,
          rate: e.target.rate.value || null,
          points: e.target.points.value || null
        };
        handleCreatePromotion(formData);
      }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Name:</label>
          <input name="name" required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Description:</label>
          <textarea name="description" required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Type:</label>
          <select name="type" required>
            <option value="automatic">Automatic</option>
            <option value="one-time">One-Time</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Start Time:</label>
          <input 
            name="startTime" 
            type="datetime-local" 
            required 
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>End Time:</label>
          <input 
            name="endTime" 
            type="datetime-local" 
            required 
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Min Spending (optional):</label>
          <input name="minSpending" type="number" min="0" step="0.01" />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Rate (optional):</label>
          <input name="rate" type="number" min="0" step="0.01" />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Points (optional):</label>
          <input name="points" type="number" min="0" />
        </div>
        <button type="submit">Create</button>
        <button 
          type="button" 
          onClick={() => navigate('/promotions')}
          style={{ marginLeft: '10px' }}
        >
          Cancel
        </button>
      </form>
    </div>
  );

  const renderEditPromotion = () => (
    <div>
      <h2>Edit Promotion</h2>
      {currentPromotion && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = {
            name: e.target.name.value,
            description: e.target.description.value,
            type: e.target.type.value,
            startTime: e.target.startTime.value,
            endTime: e.target.endTime.value,
            minSpending: e.target.minSpending.value || null,
            rate: e.target.rate.value || null,
            points: e.target.points.value || null
          };
          handleUpdatePromotion(promotionId, formData);
        }}>
          <div style={{ marginBottom: '10px' }}>
            <label>Name:</label>
            <input 
              name="name" 
              defaultValue={currentPromotion.name} 
              required 
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Description:</label>
            <textarea 
              name="description" 
              defaultValue={currentPromotion.description} 
              required 
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Type:</label>
            <select 
              name="type" 
              defaultValue={currentPromotion.type} 
              required
            >
              <option value="automatic">Automatic</option>
              <option value="one-time">One-Time</option>
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Start Time:</label>
            <input 
              name="startTime" 
              type="datetime-local" 
              defaultValue={new Date(currentPromotion.startTime).toISOString().slice(0, 16)}
              required 
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>End Time:</label>
            <input 
              name="endTime" 
              type="datetime-local" 
              defaultValue={new Date(currentPromotion.endTime).toISOString().slice(0, 16)}
              required 
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Min Spending (optional):</label>
            <input 
              name="minSpending" 
              type="number" 
              min="0" 
              step="0.01" 
              defaultValue={currentPromotion.minSpending || ''}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Rate (optional):</label>
            <input 
              name="rate" 
              type="number" 
              min="0" 
              step="0.01" 
              defaultValue={currentPromotion.rate || ''}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Points (optional):</label>
            <input 
              name="points" 
              type="number" 
              min="0" 
              defaultValue={currentPromotion.points || ''}
            />
          </div>
          <button type="submit">Save Changes</button>
          <button 
            type="button" 
            onClick={() => navigate(`/promotions/${promotionId}`)}
            style={{ marginLeft: '10px' }}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );

  const renderContent = () => {
    if (promotionId === 'new') {
      return renderCreatePromotion();
    } else if (window.location.pathname.includes('/edit')) {
      return renderEditPromotion();
    } else if (promotionId) {
      return renderPromotionDetails();
    } else {
      return renderPromotionsList();
    }
  };

  return (
    <div>
  
      <div style={{ padding: '20px' }}>
        {loading ? <div>Loading...</div> : renderContent()}
      </div>
    </div>
  );
};

export default ManagePromotions;
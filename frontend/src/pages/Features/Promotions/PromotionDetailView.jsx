import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Descriptions, message, Modal } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import NavBar from '../../../components/NavBar';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";

const PromotionDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  useEffect(() => {
    const fetchPromotion = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/promotions/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch promotion details');
        }

        const data = await response.json();
        setPromotion(data);
      } catch (err) {
        console.error('Error fetching promotion:', err);
        message.error(err.message);
        navigate('/promotions');
      } finally {
        setLoading(false);
      }
    };

    fetchPromotion();
  }, [id, navigate]);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/promotions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete promotion');
      }

      message.success('Promotion deleted successfully');
      navigate('/promotions');
    } catch (err) {
      console.error('Error deleting promotion:', err);
      message.error(err.message);
    } finally {
      setLoading(false);
      setDeleteConfirmVisible(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '24px' }}>Loading...</div>;
  if (!promotion) return <div>Promotion not found</div>;

  
  return (
    <div>
    <NavBar>
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/promotions')}
          style={{ marginBottom: '16px' }}
        >
          Back to List
        </Button>

        <Card
          title={promotion.name}
          extra={
            <div>
              <Button 
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/promotions/${id}/edit`)}
                style={{ marginRight: '8px' }}
              >
                Edit
              </Button>
              <Button 
                danger
                icon={<DeleteOutlined />}
                onClick={() => setDeleteConfirmVisible(true)}
              >
                Delete
              </Button>
            </div>
          }
        >
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Description">{promotion.description}</Descriptions.Item>
            <Descriptions.Item label="Type">
              {promotion.type === 'automatic' ? 'Automatic' : 'One-Time'}
            </Descriptions.Item>
            <Descriptions.Item label="Start Time">
              {dayjs(promotion.startTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="End Time">
              {dayjs(promotion.endTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Min Spending">
              {promotion.minSpending ? `$${promotion.minSpending.toFixed(2)}` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Rate">
              {promotion.rate ? `${(promotion.rate * 100).toFixed(0)}%` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Points">
              {promotion.points || 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Modal
          title="Confirm Delete"
          visible={deleteConfirmVisible}
          onOk={handleDelete}
          onCancel={() => setDeleteConfirmVisible(false)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <p>Are you sure you want to delete this promotion? This action cannot be undone.</p>
        </Modal>
      </div>
    </NavBar>
  </div>
  );
};

export default PromotionDetailView;
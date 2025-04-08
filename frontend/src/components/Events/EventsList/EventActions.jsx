import { Button, Space } from 'antd';
import { EditOutlined, UserOutlined } from '@ant-design/icons';

const EventActions = ({ eventId, onEdit }) => (
  <Space size="middle">
    <Button 
      icon={<EditOutlined />} 
      onClick={() => onEdit(eventId)}
    />
  </Space>
);

export default EventActions;
import { Button, Space } from 'antd';
import { EditOutlined, UserOutlined } from '@ant-design/icons';

const EventActions = ({ eventId, onEdit, onManageUsers }) => (
  <Space size="middle">
    <Button 
      icon={<EditOutlined />} 
      onClick={() => onEdit(eventId)}
    />
    <Button 
      icon={<UserOutlined />} 
      onClick={() => onManageUsers(eventId)}
    />
  </Space>
);

export default EventActions;
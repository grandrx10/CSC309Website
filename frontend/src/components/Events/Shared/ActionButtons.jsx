import { Button, Space } from 'antd';
import { EditOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';

export default ({ onEdit, onDelete, onEnroll, enrollDisabled }) => (
  <Space>
    {onEdit && <Button icon={<EditOutlined />} onClick={onEdit}>Edit</Button>}
    {onDelete && <Button danger icon={<DeleteOutlined />} onClick={onDelete}>Delete</Button>}
    {onEnroll && (
      <Button 
        type="primary" 
        icon={<UserAddOutlined />} 
        onClick={onEnroll}
        disabled={enrollDisabled}
      >
        Join
      </Button>
    )}
  </Space>
);
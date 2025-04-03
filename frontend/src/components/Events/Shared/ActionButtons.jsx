import { Button, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

export default ({ onEdit, onDelete }) => (
  <Space>
    <Button icon={<EditOutlined />} onClick={onEdit}>Edit</Button>
    <Button danger icon={<DeleteOutlined />} onClick={onDelete}>Delete</Button>
  </Space>
);
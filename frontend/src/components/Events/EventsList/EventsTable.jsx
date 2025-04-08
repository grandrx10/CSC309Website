import React from 'react';
import { Table, Button, Space, Tooltip } from 'antd';
import { EditOutlined, TeamOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from './EventsList.module.css';

const EventsTable = ({ 
  events, 
  loading, 
  onRowClick, 
  onEdit,
  onChange,
  isPrivileged
}) => {
  const columns = [
    {
      title: 'Event Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (text, record) => (
        <a onClick={() => onRowClick && onRowClick(record.id)}>
          {text}
        </a>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      sorter: true,
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      sorter: true,
      render: (text) => text ? dayjs(text).format('MMM D, YYYY h:mm A') : '',
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      sorter: true,
      render: (text) => text ? dayjs(text).format('MMM D, YYYY h:mm A') : '',
    },
    {
      title: 'Capacity',
      key: 'capacity',
      sorter: true,
      render: (_, record) => `${record.numGuests || 0}/${record.capacity || 0}`,
    },
    isPrivileged && {
      title: 'Status',
      dataIndex: 'published',
      key: 'status',
      render: (published) => (
        <span className={published ? styles.published : styles.draft}>
          {published ? 'Published' : 'Draft'}
        </span>
      ),
    },
    isPrivileged && {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Event">
            <Button 
              icon={<EyeOutlined />} 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                onRowClick && onRowClick(record.id);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit Event">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit(record.id);
              }}
            />
          </Tooltip>
        </Space>
      ),
    }
  ].filter(Boolean); // Removes false/null/undefined from array
  

  return (
    <Table
      dataSource={events}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={false} // Disable table's built-in pagination, we handle it externally
      onChange={onChange} // Handle sorting through this callback
      onRow={(record) => ({
        onClick: () => onRowClick && onRowClick(record.id),
      })}
      className={styles.table}
    />
  );
};

export default EventsTable;
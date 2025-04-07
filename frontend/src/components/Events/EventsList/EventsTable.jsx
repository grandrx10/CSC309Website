import { Table } from 'antd';
import dayjs from 'dayjs';
import styles from './EventsList.module.css';

const EventsTable = ({ 
  events, 
  loading, 
  onRowClick, 
  onEdit, 
  onManageUsers,
  showPointsColumn = false,
  showStatusColumn = false,
}) => {
  const baseColumns = [
    {
      title: 'Event Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => onRowClick(record.id)}>{text}</a>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (text) => dayjs(text).format('MMM D, YYYY h:mm A'),
      sorter: true,
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (text) => dayjs(text).format('MMM D, YYYY h:mm A'),
    },
  ];

  const optionalColumns = [
    showPointsColumn && {
      title: 'Points',
      dataIndex: 'pointsRemain',
      key: 'points',
      render: (text, record) => `${record.pointsAwarded}/${text + record.pointsAwarded}`,
    },
    showStatusColumn && {
      title: 'Status',
      dataIndex: 'published',
      key: 'status',
      render: (published) => (
        <span className={published ? styles.published : styles.draft}>
          {published ? 'Published' : 'Draft'}
        </span>
      ),
    },
  ].filter(Boolean); // Filter out false values

  const columns = [...baseColumns, ...optionalColumns];

  return (
    <Table
      columns={columns}
      dataSource={events}
      rowKey="id"
      pagination={false}
      loading={loading}
      className={styles.table}
    />
  );
};

export default EventsTable;
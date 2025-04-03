import { Input, Select, DatePicker, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from './EventsList.module.css';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;  // Get Search from Input

const EventsFilters = ({ filters, onFilterChange }) => {
  return (
    <div className={styles.filters}>
      <Search
        placeholder="Search events"
        allowClear
        enterButton={<SearchOutlined />}
        size="large"
        onSearch={(value) => onFilterChange('search', value)}
        className={styles.search}
      />

      <Select
        value={filters.status}
        style={{ width: 120 }}
        onChange={(value) => onFilterChange('status', value)}
      >
        <Option value="all">All Status</Option>
        <Option value="published">Published</Option>
        <Option value="draft">Draft</Option>
      </Select>

      <RangePicker
        showTime
        value={filters.dateRange}
        onChange={(dates) => onFilterChange('dateRange', dates)}
      />
    </div>
  );
};

export default EventsFilters;
import { Input, Select, DatePicker, Space, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from './EventsList.module.css';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

const EventsFilters = ({ 
  filters, 
  onFilterChange, 
  showStatusFilter,
  showOrganizerFilter,
  isOrganizerFilterActive
}) => {
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

      {showStatusFilter && (
        <Select
          value={filters.status}
          style={{ width: 120 }}
          onChange={(value) => onFilterChange('status', value)}
        >
          <Option value="all">All Status</Option>
          <Option value="published">Published</Option>
          <Option value="draft">Draft</Option>
        </Select>
      )}

      <RangePicker
        showTime
        value={filters.dateRange}
        onChange={(dates) => onFilterChange('dateRange', dates)}
      />

      {showOrganizerFilter && (
        <Button
          type={isOrganizerFilterActive ? "primary" : "default"}
          onClick={() => onFilterChange('organizerOnly', !filters.organizerOnly)}
        >
          My Events Only
        </Button>
      )}
    </div>
  );
};

export default EventsFilters;
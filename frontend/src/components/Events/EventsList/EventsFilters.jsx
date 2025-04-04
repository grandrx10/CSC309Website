import { Input, Select, DatePicker, Space, Checkbox } from 'antd';
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
      <Space size="middle" align="center">
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Checkbox
              checked={isOrganizerFilterActive}
              onChange={(e) => onFilterChange('organizerOnly', e.target.checked)}
              style={{ lineHeight: '32px' }}
            >
              Events I'm Organizing
            </Checkbox>
          </div>
        )}
      </Space>
    </div>
  );
};

export default EventsFilters;
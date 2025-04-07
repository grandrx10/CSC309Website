import { Input, Select, DatePicker, Space, Checkbox } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs'; // Import dayjs for date handling
import styles from './EventsList.module.css';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

const EventsFilters = ({ 
  filters, 
  onFilterChange, 
  showStatusFilter = true,
  showOrganizerFilter = false,
  isOrganizerFilterActive = false
}) => {
  // Convert date strings to dayjs objects if they exist
  const dateRangeValue = filters.dateRange?.length === 2 
    ? [
        filters.dateRange[0] ? dayjs(filters.dateRange[0]) : null, 
        filters.dateRange[1] ? dayjs(filters.dateRange[1]) : null
      ] 
    : null;

  const handleDateChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      // Convert to ISO strings
      const processedDates = [
        dates[0].toISOString(),
        dates[1].toISOString()
      ];
      onFilterChange('dateRange', processedDates);
    } else {
      onFilterChange('dateRange', null);
    }
  };

  return (
    <div className={styles.filters}>
      <Space size="middle" align="center">
        <Search
          placeholder="Search events"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
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
          showTime={{
            format: 'HH:mm',
          }}
          format="YYYY-MM-DD HH:mm"
          value={dateRangeValue}
          onChange={handleDateChange}
          placeholder={['Start Date', 'End Date']}
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
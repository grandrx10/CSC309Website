import { Input, Select, DatePicker, Space, Checkbox, Radio } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from './EventsList.module.css';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

const EventsFilters = ({ 
  filters, 
  onFilterChange, 
  showStatusFilter = true,
  showOrganizerFilter = false,
  isOrganizerFilterActive = false,
  showFullEvents = false,
  onShowFullChange = () => {}, // Add this missing prop
  pendingSearch = '',
  onSearchChange = () => {},
  onSearchSubmit = () => {}
}) => {
  const dateRangeValue = filters.dateRange?.length === 2 
    ? [
        filters.dateRange[0] ? dayjs(filters.dateRange[0]) : null, 
        filters.dateRange[1] ? dayjs(filters.dateRange[1]) : null
      ] 
    : null;

  const handleDateChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
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
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space size="middle" align="center">
          <Search
            placeholder="Search events"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={pendingSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            onSearch={onSearchSubmit}
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
                style={{ lineHeight: '32px', marginRight: 8 }}
              >
                Events I'm Organizing
              </Checkbox>
              {/* <Checkbox
                checked={showFullEvents}
                onChange={(e) => onShowFullChange(e.target.checked)}
                style={{ lineHeight: '32px' }}
              >
                Show Full Events
              </Checkbox> */}
            </div>
          )}
        </Space>

        <Space size="middle" align="center">
          <span>Sort by:</span>
          <Radio.Group
            value={filters.sortBy || 'startTime'}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="name">Event Name</Radio.Button>
            <Radio.Button value="location">Location</Radio.Button>
            <Radio.Button value="startTime">Start Time</Radio.Button>
            <Radio.Button value="endTime">End Time</Radio.Button>
          </Radio.Group>
          <Select
            value={filters.sortOrder || 'asc'}
            onChange={(value) => onFilterChange('sortOrder', value)}
            style={{ width: 120 }}
          >
            <Option value="asc">Ascending</Option>
            <Option value="desc">Descending</Option>
          </Select>
        </Space>
      </Space>
    </div>
  );
};

export default EventsFilters;
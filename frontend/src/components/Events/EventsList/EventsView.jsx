import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Pagination, Space, message, Dropdown, Menu } from 'antd';
import { PlusOutlined, SyncOutlined, UserOutlined } from '@ant-design/icons';
import EventsTable from './EventsTable';
import EventsFilters from './EventsFilters';
import styles from './EventsList.module.css';
import dayjs from 'dayjs';
import NavBar from '../../NavBar';

const ROLE_HIERARCHY = {
  'superuser': ['superuser', 'manager', 'cashier', 'regular'],
  'manager': ['manager', 'cashier', 'regular'],
  'cashier': ['cashier', 'regular'],
  'regular': ['regular']
};
require('dotenv').config()
const API_URL =  process.env.REACT_APP_API_URL || "http://localhost:3100";
const isUserOrganizer = (event, userUtorid) => {
    if (!event.organizers || !userUtorid) return false;
    return event.organizers.some(organizer =>
        organizer.utorid === userUtorid
    );
};

const EventsView = ({
    variant = 'user',
    title = 'Events',
    columns,
    initialFilters = {}
}) => {
    const navigate = useNavigate();
    const [state, setState] = useState({
        events: [],
        allEvents: [],
        loading: false,
        pagination: { current: 1, pageSize: 10, total: 0 },
        filters: {
            search: '',
            status: 'all',
            dateRange: null,
            organizerOnly: false,
            sortBy: 'startTime',
            sortOrder: 'asc',
            ...initialFilters
        }
    });
    const [user, setUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    const [showSettings, setShowSettings] = useState({
        showCreateButton: false,
        showStatusFilter: false,
        showPointsColumn: false,
        showOrganizerFilter: false
    });
    const [currentViewRole, setCurrentViewRole] = useState(null);
    
    const fetchCurrentUser = useCallback(async () => {
        try {
            setUserLoading(true);
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(API_URL + '/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('authToken');
                    navigate('/login');
                    throw new Error('Session expired. Please login again.');
                }
                const errorData = await response.json();
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }

            const userData = await response.json();
            setUser(userData);
            setCurrentViewRole(userData.role.toLowerCase()); // Initialize with user's actual role

            setUserLoading(false);
        } catch (error) {
            console.error('Error fetching user:', error);
            message.error(error.message || 'Failed to load user data');
            setUserLoading(false);
        }
    }, [navigate]);

    // Update showSettings based on currentViewRole
    useEffect(() => {
        if (!currentViewRole || !user) return;
        
        const isPrivileged = ['manager', 'superuser'].includes(currentViewRole);
        setShowSettings({
            showCreateButton: ['manager', 'superuser'].includes(currentViewRole),
            showStatusFilter: isPrivileged,
            showPointsColumn: isPrivileged,
            showOrganizerFilter: true
        });
    }, [currentViewRole, user]);

    const fetchEvents = useCallback(async () => {
        if (!user && variant === 'organizer') {
            await fetchCurrentUser();
            return;
        }

        setState(prev => ({ ...prev, loading: true }));
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No authentication token found');

            const params = new URLSearchParams({
                page: state.pagination.current,
                limit: state.pagination.pageSize,
                name: state.filters.search
            });

            if (state.filters.status === 'published' || state.filters.status === 'draft') {
                params.set('published', state.filters.status === 'published');
            }

            const response = await fetch(API_URL + `/events?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('authToken');
                    navigate('/login');
                    throw new Error('Session expired. Please login again.');
                }
                const errorData = await response.json();
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }

            const { count, results } = await response.json();
            
            setState(prev => ({
                ...prev,
                allEvents: results,
                loading: false
            }));
            
        } catch (error) {
            console.error('Error fetching events:', error);
            setState(prev => ({ ...prev, loading: false }));
            message.error(error.message || 'Failed to load events');
        }
    }, [
        state.pagination.current,
        state.pagination.pageSize,
        state.filters.search,
        state.filters.status,
        variant,
        navigate,
        user,
        fetchCurrentUser
    ]);
    
    const applyFilters = useCallback(() => {
        const { allEvents, filters } = state;
        
        if (!allEvents.length) return;
        
        let filteredEvents = [...allEvents];
        
        if (filters.dateRange && Array.isArray(filters.dateRange) && 
            filters.dateRange.length === 2 && filters.dateRange[0] && filters.dateRange[1]) {
            
            const startDate = new Date(filters.dateRange[0]);
            const endDate = new Date(filters.dateRange[1]);
            
            filteredEvents = filteredEvents.filter(event => {
                const eventStart = new Date(event.startTime);
                return eventStart >= startDate && eventStart <= endDate;
            });
        }
        
        if (filters.organizerOnly && user) {
            filteredEvents = filteredEvents.filter(event => 
                isUserOrganizer(event, user.utorid)
            );
        }
        
        if (filters.sortBy) {
            filteredEvents.sort((a, b) => {
                let comparison = 0;
                
                switch (filters.sortBy) {
                    case 'name':
                        comparison = a.name.localeCompare(b.name);
                        break;
                    case 'location':
                        comparison = a.location.localeCompare(b.location);
                        break;
                    case 'startTime':
                        comparison = new Date(a.startTime) - new Date(b.startTime);
                        break;
                    case 'endTime':
                        comparison = new Date(a.endTime) - new Date(b.endTime);
                        break;
                    default:
                        comparison = 0;
                }
                
                return filters.sortOrder === 'desc' ? -comparison : comparison;
            });
        }
        
        setState(prev => {
            const totalFilteredEvents = filteredEvents.length;
            const { pageSize, current } = prev.pagination;
            
            const maxPage = Math.max(1, Math.ceil(totalFilteredEvents / pageSize));
            const newCurrent = current > maxPage ? 1 : current;
            
            return {
                ...prev,
                events: filteredEvents,
                pagination: {
                    ...prev.pagination,
                    total: totalFilteredEvents,
                    current: newCurrent
                }
            };
        });
    }, [state.allEvents, state.filters, user]);
    
    const paginatedEvents = useMemo(() => {
        const { current, pageSize } = state.pagination;
        const startIndex = (current - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return state.events.slice(startIndex, endIndex);
    }, [state.events, state.pagination.current, state.pagination.pageSize]);
    
    const handlePaginationChange = (page, pageSize) => {
        setState(prev => ({
            ...prev,
            pagination: { 
                ...prev.pagination, 
                current: page,
                pageSize: pageSize || prev.pagination.pageSize
            }
        }));
    };

    const handleRoleChange = (role) => {
        setCurrentViewRole(role);
    };

    const renderRoleDropdown = () => {
        if (!user) return null;
        
        const userRole = user.role.toLowerCase();
        const availableRoles = ROLE_HIERARCHY[userRole] || ['regular'];
        
        const menu = (
            <Menu onClick={({ key }) => handleRoleChange(key)}>
                {availableRoles.map(role => (
                    <Menu.Item key={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Menu.Item>
                ))}
            </Menu>
        );
        
        return (
            <Dropdown overlay={menu} placement="bottomRight">
                <Button icon={<UserOutlined />}>
                    Viewing as: {currentViewRole ? currentViewRole.charAt(0).toUpperCase() + currentViewRole.slice(1) : 'Unknown'}
                </Button>
            </Dropdown>
        );
    };

    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    useEffect(() => {
        if ((user || variant !== 'organizer') && !userLoading) {
            fetchEvents();
        }
    }, [fetchEvents, user, variant, userLoading, currentViewRole]);
    
    useEffect(() => {
        applyFilters();
    }, [applyFilters, state.allEvents, state.filters.dateRange, state.filters.organizerOnly]);

    const handleFilterChange = (filterName, value) => {
        setState(prev => ({
            ...prev,
            filters: { ...prev.filters, [filterName]: value },
            pagination: { ...prev.pagination, current: 1 }
        }));
    };

    const defaultColumns = useMemo(() => [
        {
            title: 'Event Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <a onClick={() => navigate(`/events/${record.id}`)}>{text}</a>
            ),
            sorter: {
                compare: (a, b) => a.name.localeCompare(b.name),
                multiple: 3,
            },
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
            sorter: {
                compare: (a, b) => a.location.localeCompare(b.location),
                multiple: 2,
            },
        },
        {
            title: 'Start Time',
            dataIndex: 'startTime',
            key: 'startTime',
            render: (text) => dayjs(text).format('MMM D, YYYY h:mm A'),
            sorter: {
                compare: (a, b) => new Date(a.startTime) - new Date(b.startTime),
                multiple: 1,
            },
        },
        {
            title: 'End Time',
            dataIndex: 'endTime',
            key: 'endTime',
            render: (text) => dayjs(text).format('MMM D, YYYY h:mm A'),
            sorter: {
                compare: (a, b) => new Date(a.endTime) - new Date(b.endTime),
                multiple: 1,
            },
        },
        ...(showSettings.showPointsColumn ? [{
            title: 'Points',
            dataIndex: 'pointsRemain',
            key: 'points',
            render: (text, record) => `${record.pointsAwarded}/${text + record.pointsAwarded}`,
        }] : []),
        ...(showSettings.showStatusFilter ? [{
            title: 'Status',
            dataIndex: 'published',
            key: 'status',
            render: (published) => (
                <span className={published ? styles.published : styles.draft}>
                    {published ? 'Published' : 'Draft'}
                </span>
            ),
        }] : [])
    ], [showSettings.showPointsColumn, showSettings.showStatusFilter, navigate]);

    return (
        <div>
            <NavBar>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h2>{title}</h2>
                        <Space>
                            <Button
                                icon={<SyncOutlined />}
                                onClick={fetchEvents}
                                loading={state.loading || userLoading}
                            >
                                Refresh
                            </Button>
                            {showSettings.showCreateButton && (
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => navigate('/events/create')}
                                >
                                    Create Event
                                </Button>
                            )}
                            {renderRoleDropdown()}
                        </Space>
                    </div>

                    <EventsFilters
                        showStatusFilter={showSettings.showStatusFilter}
                        showOrganizerFilter={showSettings.showOrganizerFilter && !!user}
                        isOrganizerFilterActive={state.filters.organizerOnly}
                        filters={state.filters}
                        onFilterChange={handleFilterChange}
                    />

                    <EventsTable
                        events={paginatedEvents}
                        loading={state.loading || userLoading}
                        onRowClick={(id) => navigate(`/events/${id}`)}
                        showPointsColumn={showSettings.showPointsColumn}
                        showStatusColumn={showSettings.showStatusFilter}
                        showActionsColumn={showSettings.showCreateButton}
                        columns={columns || defaultColumns}
                    />

                <Pagination
                    current={state.pagination.current}
                    pageSize={state.pagination.pageSize}
                    total={state.pagination.total}
                    onChange={handlePaginationChange}
                    onShowSizeChange={(current, size) => handlePaginationChange(1, size)}
                    showSizeChanger
                    showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                    className={styles.pagination}
                />
                </div>
            </NavBar>
        </div>
    );
};

export default EventsView;
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthYear } from '../../utils/dateTime';

const CalendarPanel = ({ viewDate, activeDate, getTodayLocal, onDayClick, onChangeMonth, onGoToToday }) => {
    const weekdayNames = ['s', 'm', 't', 'w', 'th', 'f', 'sa'];

    const getCalendarDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startingDayOfWeek = firstDayOfMonth.getDay();
        const calendarDays = [];

        const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const dateObj = new Date(year, month - 1, lastDayOfPrevMonth - i);
            calendarDays.push({
                day: lastDayOfPrevMonth - i, month: month - 1, year, currentMonth: false, full: dateObj.toLocaleDateString('en-CA')
            });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(year, month, i);
            calendarDays.push({
                day: i, month, year, currentMonth: true, full: dateObj.toLocaleDateString('en-CA')
            });
        }
        const totalCells = 42;
        const nextMonthPadding = totalCells - calendarDays.length;
        for (let i = 1; i <= nextMonthPadding; i++) {
            const dateObj = new Date(year, month + 1, i);
            calendarDays.push({
                day: i, month: month + 1, year, currentMonth: false, full: dateObj.toLocaleDateString('en-CA')
            });
        }
        return calendarDays;
    };

    return (
        <div className="glass playlist-calendar-panel" style={{ padding: '1.5rem', borderRadius: '24px' }}>
            <div className="playlist-calendar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Study Planner</span>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>
                        {formatMonthYear(viewDate)}
                    </h2>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button onClick={onGoToToday} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem', fontWeight: '800', borderRadius: '8px' }}>
                        Today
                    </button>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                        <button onClick={() => onChangeMonth(-1)} className="btn-secondary" style={{ padding: '0.35rem', borderRadius: '8px' }}><ChevronLeft size={16} /></button>
                        <button onClick={() => onChangeMonth(1)} className="btn-secondary" style={{ padding: '0.35rem', borderRadius: '8px' }}><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>
            <div className="playlist-calendar-weekdays" style={{ gridTemplateColumns: 'repeat(7, 1fr)', display: 'grid', gap: '0.4rem', marginBottom: '0.75rem' }}>
                {weekdayNames.map((day, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '800', color: 'rgba(255,255,255,0.2)' }}>{day}</div>
                ))}
            </div>
            <div className="playlist-calendar-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', display: 'grid', gap: '0.4rem' }}>
                {getCalendarDays().map((d, i) => {
                    const isToday = getTodayLocal() === d.full;
                    const isActive = activeDate === d.full;
                    return (
                        <button
                            key={i}
                            onClick={() => onDayClick(d.full)}
                            style={{
                                borderRadius: '10px', aspectRatio: '1/1', fontSize: '0.9rem', cursor: 'pointer',
                                background: isActive ? 'var(--primary)' : (isToday ? 'rgba(99, 102, 241, 0.1)' : 'transparent'),
                                color: isActive ? 'white' : (d.currentMonth ? 'var(--text-main)' : 'rgba(255,255,255,0.1)'),
                                border: isToday && !isActive ? '1px solid var(--primary)' : '1px solid transparent',
                                fontWeight: (isActive || isToday) ? '800' : '500'
                            }}
                        >
                            {d.day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarPanel;

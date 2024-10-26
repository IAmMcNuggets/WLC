import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { saveAs } from 'file-saver';

const TimeclockContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  background-image: url(${require('../Background/86343.jpg')});
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TimeclockTitle = styled.h1`
  text-align: center;
  width: 100%;
  margin-top: 20px;
  margin-bottom: 30px;
  color: black;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  font-size: 2.5rem;
`;

const TimeclockControls = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
`;

const Button = styled.button<{ isClockOut?: boolean }>`
  background-color: ${props => props.isClockOut ? '#f44336' : '#4CAF50'};
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin: 0 10px;

  &:hover {
    background-color: ${props => props.isClockOut ? '#d32f2f' : '#45a049'};
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const TimeEntryList = styled.ul`
  list-style-type: none;
  padding: 0;
  width: 90%;
  max-width: 600px;
`;

const TimeEntry = styled.li`
  background-color: rgba(255, 255, 255, 0.9);
  margin: 15px 0;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  position: relative;
`;

const EntryInfo = styled.div`
  flex-grow: 1;
  margin-bottom: 20px; // Add some space above the delete button
`;

const EntryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const EntryDate = styled.span`
  font-weight: bold;
  color: #333;
`;

const EntryDuration = styled.span`
  color: #666;
`;

const EntryTime = styled.p`
  margin: 8px 0;
  color: #444;
`;

const DeleteButton = styled.button`
  background-color: transparent;
  color: #888;
  border: none;
  font-size: 14px;
  cursor: pointer;
  padding: 5px;
  position: absolute;
  bottom: 10px;
  right: 10px;
  opacity: 0.6;
  transition: opacity 0.3s, color 0.3s;

  &:hover {
    opacity: 1;
    color: #d32f2f;
  }
`;

const ExportButton = styled(Button)`
  background-color: #2196F3;
  margin-top: 20px;

  &:hover {
    background-color: #1976D2;
  }
`;

interface TimeEntryData {
  id: number;
  clockIn: string;
  clockOut: string | null;
}

function Timeclock() {
  const [timeEntries, setTimeEntries] = useState<TimeEntryData[]>([]);
  const [isClockedIn, setIsClockedIn] = useState(false);

  useEffect(() => {
    // Load time entries from local storage when component mounts
    const storedEntries = localStorage.getItem('timeEntries');
    console.log('Loaded entries from localStorage:', storedEntries);
    if (storedEntries) {
      try {
        const parsedEntries = JSON.parse(storedEntries);
        setTimeEntries(parsedEntries);
        
        // Check if user is currently clocked in
        const lastEntry = parsedEntries[0];
        if (lastEntry && !lastEntry.clockOut) {
          setIsClockedIn(true);
        }
      } catch (error) {
        console.error('Error parsing stored entries:', error);
        // Handle the error, maybe clear the invalid data
        localStorage.removeItem('timeEntries');
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Saving entries to localStorage:', timeEntries);
      localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
    }, 100);

    return () => clearTimeout(timer);
  }, [timeEntries]);

  const handleClockIn = () => {
    const newEntry: TimeEntryData = {
      id: Date.now(),
      clockIn: new Date().toISOString(),
      clockOut: null
    };
    setTimeEntries(prevEntries => [newEntry, ...prevEntries]);
    setIsClockedIn(true);
  };

  const handleClockOut = () => {
    setTimeEntries(prevEntries => 
      prevEntries.map((entry, index) => 
        index === 0 ? { ...entry, clockOut: new Date().toISOString() } : entry
      )
    );
    setIsClockedIn(false);
  };

  const handleDeleteEntry = (id: number) => {
    setTimeEntries(prevEntries => {
      const updatedEntries = prevEntries.filter(entry => entry.id !== id);
      if (updatedEntries.length === 0 || updatedEntries[0].clockOut !== null) {
        setIsClockedIn(false);
      }
      return updatedEntries;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const calculateDuration = (clockIn: string, clockOut: string | null) => {
    if (!clockOut) return 'In progress';
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Clock In', 'Clock Out', 'Duration'],
      ...timeEntries.map(entry => {
        const date = new Date(entry.clockIn);
        const formattedDate = `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`;
        const clockIn = formatTime(entry.clockIn);
        const clockOut = entry.clockOut ? formatTime(entry.clockOut) : 'Not clocked out';
        const duration = calculateDuration(entry.clockIn, entry.clockOut);
        return [formattedDate, clockIn, clockOut, duration];
      })
    ].map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'timeclock_entries.csv');
  };

  return (
    <TimeclockContainer>
      <TimeclockTitle>Timeclock</TimeclockTitle>
      <TimeclockControls>
        <Button onClick={handleClockIn} disabled={isClockedIn}>Clock In</Button>
        <Button onClick={handleClockOut} disabled={!isClockedIn} isClockOut>Clock Out</Button>
      </TimeclockControls>
      <ExportButton onClick={exportToCSV}>Export to CSV</ExportButton>
      <TimeEntryList>
        {timeEntries.map((entry) => (
          <TimeEntry key={entry.id}>
            <EntryInfo>
              <EntryHeader>
                <EntryDate>{formatDate(new Date(entry.clockIn))}</EntryDate>
                <EntryDuration>{calculateDuration(entry.clockIn, entry.clockOut)}</EntryDuration>
              </EntryHeader>
              <EntryTime>Clock In: {formatTime(entry.clockIn)}</EntryTime>
              <EntryTime>Clock Out: {entry.clockOut ? formatTime(entry.clockOut) : 'Not clocked out'}</EntryTime>
            </EntryInfo>
            <DeleteButton onClick={() => handleDeleteEntry(entry.id)}>Delete</DeleteButton>
          </TimeEntry>
        ))}
      </TimeEntryList>
    </TimeclockContainer>
  );
}

export default Timeclock;

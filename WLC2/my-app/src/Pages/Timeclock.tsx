import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { saveAs } from 'file-saver';
import { collection, addDoc, updateDoc, doc, query, where, orderBy, onSnapshot, deleteDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { GoogleUser } from '../types/user';

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
  padding-bottom: 100px; // Added for bottom navigation bar
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

const Button = styled.button<{ $isClockOut?: boolean }>`
  background-color: ${props => props.$isClockOut ? '#f44336' : '#4CAF50'};
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin: 0 10px;

  &:hover {
    background-color: ${props => props.$isClockOut ? '#d32f2f' : '#45a049'};
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
  id: string;
  userId: string;
  userName: string;
  clockIn: Timestamp;
  clockOut: Timestamp | null;
  createdAt: Timestamp;
}

interface TimeclockProps {
  user: GoogleUser | null;
}

function Timeclock({ user }: TimeclockProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntryData[]>([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser || !user) return;

    // Subscribe to Firestore for real-time updates of user's time entries
    const timeEntriesRef = collection(firestore, 'timeEntries');
    const userEntriesQuery = query(
      timeEntriesRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(userEntriesQuery, 
      (snapshot) => {
        const entries: TimeEntryData[] = [];
        snapshot.forEach((doc) => {
          entries.push({ 
            id: doc.id, 
            ...doc.data() 
          } as TimeEntryData);
        });
        
        setTimeEntries(entries);
        
        // Check if user is currently clocked in based on latest entry
        const lastEntry = entries[0];
        setIsClockedIn(lastEntry && !lastEntry.clockOut);
        setIsLoading(false);
      },
      (error) => {
        console.error('Firestore snapshot error:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, user]);

  const handleClockIn = async () => {
    if (!currentUser || !user) return;
    
    try {
      const newEntry = {
        userId: currentUser.uid,
        userName: user.name,
        clockIn: serverTimestamp(),
        clockOut: null,
        createdAt: serverTimestamp(),
        status: 'active'
      };
      
      await addDoc(collection(firestore, 'timeEntries'), newEntry);
      setIsClockedIn(true);
    } catch (error) {
      console.error('Error clocking in:', error);
    }
  };

  const handleClockOut = async () => {
    if (!currentUser || timeEntries.length === 0) return;
    
    try {
      const latestEntry = timeEntries[0];
      const entryRef = doc(firestore, 'timeEntries', latestEntry.id);
      
      await updateDoc(entryRef, {
        clockOut: serverTimestamp()
      });
      
      setIsClockedIn(false);
    } catch (error) {
      console.error('Error clocking out:', error);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const entryRef = doc(firestore, 'timeEntries', id);
      await deleteDoc(entryRef);
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'Loading...';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return 'Loading...';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const calculateDuration = (clockIn: Timestamp, clockOut: Timestamp | null) => {
    if (!clockIn) return 'Calculating...';
    if (!clockOut) return 'In progress';
    
    const start = clockIn.toDate();
    const end = clockOut.toDate();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Clock In', 'Clock Out', 'Duration'],
      ...timeEntries.map(entry => {
        if (!entry.clockIn) return ['Loading...', 'Loading...', 'Loading...', 'Loading...'];
        
        const date = entry.clockIn.toDate();
        const formattedDate = `${date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}`;
        
        const clockIn = entry.clockIn ? formatTime(entry.clockIn) : 'Loading...';
        const clockOut = entry.clockOut ? formatTime(entry.clockOut) : 'Not clocked out';
        const duration = calculateDuration(entry.clockIn, entry.clockOut);
        
        return [formattedDate, clockIn, clockOut, duration];
      })
    ].map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'timeclock_entries.csv');
  };

  if (!user) return <div>Please log in to use the timeclock.</div>;
  if (isLoading) return <div>Loading time entries...</div>;

  return (
    <TimeclockContainer>
      <TimeclockTitle>Timeclock</TimeclockTitle>
      <TimeclockControls>
        <Button onClick={handleClockIn} disabled={isClockedIn}>Clock In</Button>
        <Button onClick={handleClockOut} disabled={!isClockedIn} $isClockOut>Clock Out</Button>
      </TimeclockControls>
      <ExportButton onClick={exportToCSV}>Export to CSV</ExportButton>
      <TimeEntryList>
        {timeEntries.map((entry) => (
          <TimeEntry key={entry.id}>
            <EntryInfo>
              <EntryHeader>
                <EntryDate>{entry.clockIn ? formatDate(entry.clockIn) : 'Loading...'}</EntryDate>
                <EntryDuration>{calculateDuration(entry.clockIn, entry.clockOut)}</EntryDuration>
              </EntryHeader>
              <EntryTime>Clock In: {entry.clockIn ? formatTime(entry.clockIn) : 'Loading...'}</EntryTime>
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

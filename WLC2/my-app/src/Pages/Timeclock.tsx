import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { saveAs } from 'file-saver';
import { collection, addDoc, updateDoc, doc, query, where, orderBy, onSnapshot, deleteDoc, Timestamp, serverTimestamp, getDocs, getDoc } from 'firebase/firestore';
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

const CompanySelector = styled.div`
  margin-bottom: 20px;
  width: 90%;
  max-width: 400px;
  
  h3 {
    margin-bottom: 8px;
    font-size: 1rem;
    color: #333;
    text-align: center;
  }
  
  select {
    width: 100%;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
    background-color: white;
    font-size: 16px;
  }
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

const EmptyMessage = styled.div`
  text-align: center;
  margin: 20px 0;
  color: #666;
  font-style: italic;
`;

interface Company {
  id: string;
  name: string;
  location?: string;
}

interface CompanyMembership {
  companyId: string;
  status: string;
  company: Company;
}

interface TimeEntryData {
  id: string;
  userId: string;
  userName?: string;
  companyId: string;
  eventId?: string;
  startTime: Timestamp;
  endTime: Timestamp | null;
  duration?: number;
  status: string;
  notes?: string;
  createdAt: Timestamp;
}

interface TimeclockProps {
  user: GoogleUser | null;
}

function Timeclock({ user }: TimeclockProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntryData[]>([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [companies, setCompanies] = useState<CompanyMembership[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const { currentUser } = useAuth();

  // Load user's companies
  useEffect(() => {
    const loadUserCompanies = async () => {
      if (!currentUser) {
        setLoadingCompanies(false);
        return;
      }
      
      try {
        // Get all active company memberships for the user
        const membershipsQuery = query(
          collection(firestore, 'companyMembers'),
          where('userId', '==', currentUser.uid),
          where('status', '==', 'active')
        );
        
        const snapshot = await getDocs(membershipsQuery);
        
        // Fetch company details for each membership
        const companiesData = await Promise.all(
          snapshot.docs.map(async (memberDoc) => {
            const membership = { id: memberDoc.id, ...memberDoc.data() } as Omit<CompanyMembership, 'company'>;
            const companyDoc = await getDoc(doc(firestore, 'companies', membership.companyId));
            
            if (companyDoc.exists()) {
              const companyData = companyDoc.data();
              return {
                ...membership,
                company: { 
                  id: companyDoc.id, 
                  name: companyData.name || 'Unknown Company',
                  location: companyData.location || ''
                }
              } as CompanyMembership;
            }
            return null;
          })
        );
        
        // Filter out null values and set companies
        const validCompanies = companiesData.filter(c => c !== null) as CompanyMembership[];
        setCompanies(validCompanies);
        
        // Set selected company - first try localStorage, then first company in the list
        const storedCompanyId = localStorage.getItem('selectedCompanyId');
        if (storedCompanyId && validCompanies.some(c => c.companyId === storedCompanyId)) {
          setSelectedCompanyId(storedCompanyId);
        } else if (validCompanies.length > 0) {
          setSelectedCompanyId(validCompanies[0].companyId);
          localStorage.setItem('selectedCompanyId', validCompanies[0].companyId);
        }
      } catch (error) {
        console.error('Error loading user companies:', error);
      } finally {
        setLoadingCompanies(false);
      }
    };
    
    loadUserCompanies();
  }, [currentUser]);

  // Load time entries for selected company
  useEffect(() => {
    if (!currentUser || !user || !selectedCompanyId) return;

    // Subscribe to Firestore for real-time updates of user's time entries
    const timeEntriesRef = collection(firestore, 'timeEntries');
    const userEntriesQuery = query(
      timeEntriesRef,
      where('userId', '==', currentUser.uid),
      where('companyId', '==', selectedCompanyId),
      orderBy('createdAt', 'desc')
    );

    setIsLoading(true);
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
        setIsClockedIn(lastEntry && !lastEntry.endTime);
        setIsLoading(false);
      },
      (error) => {
        console.error('Firestore snapshot error:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, user, selectedCompanyId]);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const companyId = e.target.value;
    setSelectedCompanyId(companyId);
    localStorage.setItem('selectedCompanyId', companyId);
  };

  const handleClockIn = async () => {
    if (!currentUser || !user || !selectedCompanyId) {
      console.error('Missing required data: user or company');
      return;
    }
    
    try {
      const newEntry = {
        userId: currentUser.uid,
        userName: user.name,
        companyId: selectedCompanyId,
        startTime: serverTimestamp(),
        endTime: null,
        status: 'in_progress',
        notes: '',
        createdAt: serverTimestamp()
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
      
      // Calculate duration if we have a valid startTime
      let duration = null;
      if (latestEntry.startTime) {
        const startDate = latestEntry.startTime.toDate();
        const endDate = new Date(); // current time
        duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000); // duration in seconds
      }
      
      await updateDoc(entryRef, {
        endTime: serverTimestamp(),
        status: 'completed',
        duration: duration
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

  const calculateDuration = (startTime: Timestamp, endTime: Timestamp | null) => {
    if (!startTime) return 'Calculating...';
    if (!endTime) return 'In progress';
    
    const start = startTime.toDate();
    const end = endTime.toDate();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Clock In', 'Clock Out', 'Duration', 'Notes'],
      ...timeEntries.map(entry => {
        if (!entry.startTime) return ['Loading...', 'Loading...', 'Loading...', 'Loading...', ''];
        
        const date = entry.startTime.toDate();
        const formattedDate = `${date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}`;
        
        const clockIn = entry.startTime ? formatTime(entry.startTime) : 'Loading...';
        const clockOut = entry.endTime ? formatTime(entry.endTime) : 'Not clocked out';
        const duration = calculateDuration(entry.startTime, entry.endTime);
        const notes = entry.notes || '';
        
        return [formattedDate, clockIn, clockOut, duration, notes];
      })
    ].map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'timeclock_entries.csv');
  };

  if (!user) return <div>Please log in to use the timeclock.</div>;
  if (loadingCompanies) return <div>Loading your companies...</div>;
  if (companies.length === 0) return <div>You need to join a company before using the timeclock. Please go to the Dashboard to find or create a company.</div>;
  if (isLoading) return <div>Loading time entries...</div>;

  // Find the name of the selected company
  const selectedCompany = companies.find(c => c.companyId === selectedCompanyId);
  const companyName = selectedCompany ? selectedCompany.company.name : '';

  return (
    <TimeclockContainer>
      <TimeclockTitle>Timeclock</TimeclockTitle>

      <CompanySelector>
        <h3>Select Company</h3>
        <select 
          value={selectedCompanyId}
          onChange={handleCompanyChange}
        >
          {companies.map(c => (
            <option key={c.companyId} value={c.companyId}>
              {c.company.name}
            </option>
          ))}
        </select>
      </CompanySelector>

      <TimeclockControls>
        <Button onClick={handleClockIn} disabled={isClockedIn}>
          Clock In for {companyName}
        </Button>
        <Button onClick={handleClockOut} disabled={!isClockedIn} $isClockOut>
          Clock Out
        </Button>
      </TimeclockControls>
      
      <ExportButton onClick={exportToCSV}>Export to CSV</ExportButton>
      
      <TimeEntryList>
        {timeEntries.length === 0 ? (
          <EmptyMessage>
            No time entries found for this company
          </EmptyMessage>
        ) : (
          timeEntries.map((entry) => (
            <TimeEntry key={entry.id}>
              <EntryInfo>
                <EntryHeader>
                  <EntryDate>{entry.startTime ? formatDate(entry.startTime) : 'Loading...'}</EntryDate>
                  <EntryDuration>{calculateDuration(entry.startTime, entry.endTime)}</EntryDuration>
                </EntryHeader>
                <EntryTime>Clock In: {entry.startTime ? formatTime(entry.startTime) : 'Loading...'}</EntryTime>
                <EntryTime>Clock Out: {entry.endTime ? formatTime(entry.endTime) : 'Not clocked out'}</EntryTime>
                {entry.notes && <EntryTime>Notes: {entry.notes}</EntryTime>}
              </EntryInfo>
              <DeleteButton onClick={() => handleDeleteEntry(entry.id)}>Delete</DeleteButton>
            </TimeEntry>
          ))
        )}
      </TimeEntryList>
    </TimeclockContainer>
  );
}

export default Timeclock;

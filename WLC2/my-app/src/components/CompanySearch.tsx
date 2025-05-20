import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import styled from 'styled-components';
import { FaSearch, FaBuilding, FaSpinner } from 'react-icons/fa';
import Button from './Button';
import { useToast } from '../contexts/ToastContext';

const Container = styled.div`
  padding: 1rem;
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #666;
    margin: 0;
    font-size: 0.9rem;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  
  input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px 0 0 4px;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: #4a6cf7;
    }
  }
`;

const CompanyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const CompanyCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
`;

const CompanyInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  .icon {
    width: 40px;
    height: 40px;
    background-color: #4a6cf7;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.2rem;
  }
  
  .details {
    h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
    }
    
    p {
      margin: 0;
      font-size: 0.85rem;
      color: #666;
    }
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 2rem 0;
  color: #666;
`;

interface CompanySearchProps {
  onComplete?: () => void;
}

function CompanySearch({ onComplete }: CompanySearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [requestedCompanies, setRequestedCompanies] = useState<string[]>([]);
  const { addToast } = useToast();
  
  useEffect(() => {
    // Load user's existing company requests
    const loadExistingRequests = async () => {
      if (!auth.currentUser) return;
      
      try {
        const requestsQuery = query(
          collection(firestore, 'companyMembers'),
          where('userId', '==', auth.currentUser.uid)
        );
        
        const snapshot = await getDocs(requestsQuery);
        const companyIds = snapshot.docs.map(doc => doc.data().companyId);
        setRequestedCompanies(companyIds);
      } catch (error) {
        console.error('Error loading company requests:', error);
      }
    };
    
    loadExistingRequests();
  }, []);
  
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setCompanies([]);
    
    try {
      // Create case-insensitive queries (Firebase doesn't support case-insensitive search natively)
      // So we use a range query with the term and a term+Unicode Character
      const nameStartsWithQuery = query(
        collection(firestore, 'companies'),
        where('name', '>=', searchTerm.trim()),
        where('name', '<=', searchTerm.trim() + '\uf8ff')
      );
      
      const snapshot = await getDocs(nameStartsWithQuery);
      
      if (snapshot.empty) {
        // Try partial match (this is not ideal but a workaround)
        // In a production app, you might want to consider using Algolia or Firebase Extensions
        const allCompaniesQuery = query(collection(firestore, 'companies'));
        const allSnapshot = await getDocs(allCompaniesQuery);
        
        const filteredCompanies = allSnapshot.docs
          .filter(doc => {
            const name = doc.data().name.toLowerCase();
            return name.includes(searchTerm.trim().toLowerCase());
          })
          .map(doc => ({ id: doc.id, ...doc.data() }));
        
        setCompanies(filteredCompanies);
      } else {
        setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (error) {
      console.error('Error searching companies:', error);
      addToast('Error searching for companies', 'error');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleRequestJoin = async (companyId: string) => {
    if (!auth.currentUser) {
      addToast('You must be logged in to request to join a company', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create a unique ID that combines userId and companyId
      const membershipId = `${auth.currentUser.uid}_${companyId}`;
      
      await setDoc(doc(firestore, 'companyMembers', membershipId), {
        userId: auth.currentUser.uid,
        companyId,
        role: 'worker',
        status: 'pending',
        requestedAt: serverTimestamp()
      });
      
      setRequestedCompanies(prev => [...prev, companyId]);
      addToast('Join request sent successfully', 'success');
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error sending join request:', error);
      addToast('Failed to send join request', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Container>
      <Header>
        <h2>Find a Company</h2>
        <p>Search for a company by name to request access</p>
      </Header>
      
      <SearchContainer>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter company name"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button 
          onClick={handleSearch}
          variant="primary"
          leftIcon={isSearching ? <FaSpinner /> : <FaSearch />}
          isLoading={isSearching}
        >
          Search
        </Button>
      </SearchContainer>
      
      <CompanyList>
        {isSearching ? (
          <NoResults>Searching...</NoResults>
        ) : companies.length === 0 && searchTerm ? (
          <NoResults>No companies found matching "{searchTerm}"</NoResults>
        ) : (
          companies.map(company => (
            <CompanyCard key={company.id}>
              <CompanyInfo>
                <div className="icon">
                  <FaBuilding />
                </div>
                <div className="details">
                  <h3>{company.name}</h3>
                  <p>{company.location}</p>
                </div>
              </CompanyInfo>
              
              <Button
                onClick={() => handleRequestJoin(company.id)}
                variant="secondary"
                size="small"
                disabled={requestedCompanies.includes(company.id) || isLoading}
                isLoading={isLoading}
              >
                {requestedCompanies.includes(company.id) ? 'Requested' : 'Request to Join'}
              </Button>
            </CompanyCard>
          ))
        )}
      </CompanyList>
    </Container>
  );
}

export default CompanySearch; 
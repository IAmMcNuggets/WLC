import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import styled from 'styled-components';
import { FaBuilding, FaPlus, FaSpinner } from 'react-icons/fa';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';
import CompanySearch from '../components/CompanySearch';
import { useToast } from '../contexts/ToastContext';

const Container = styled.div`
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
  
  h2 {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #666;
    margin: 0;
  }
`;

const CompanyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const CompanyCard = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  cursor: ${props => props.isActive ? 'pointer' : 'default'};
  transition: transform 0.2s;
  opacity: ${props => props.isActive ? 1 : 0.7};
  
  &:hover {
    transform: ${props => props.isActive ? 'translateY(-2px)' : 'none'};
  }
`;

const CompanyIcon = styled.div`
  width: 50px;
  height: 50px;
  background-color: #4a6cf7;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const CompanyDetails = styled.div`
  flex: 1;
  
  h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.1rem;
  }
  
  p {
    margin: 0;
    font-size: 0.85rem;
    color: #666;
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  margin-left: auto;
  background-color: ${props => {
    switch(props.status) {
      case 'active': return '#e6f7e6';
      case 'pending': return '#fff4e5';
      default: return '#f8e6e6';
    }
  }};
  color: ${props => {
    switch(props.status) {
      case 'active': return '#2c662d';
      case 'pending': return '#966600';
      default: return '#c62828';
    }
  }};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  
  h3 {
    margin-bottom: 1rem;
  }
  
  p {
    color: #666;
    margin-bottom: 2rem;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  
  svg {
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface CompanyMembership {
  id: string;
  userId: string;
  companyId: string;
  status: 'active' | 'pending' | 'rejected';
  role: 'owner' | 'admin' | 'worker';
  company: {
    id: string;
    name: string;
    location: string;
    ownerId: string;
  } | null;
}

function Dashboard() {
  const [companies, setCompanies] = useState<CompanyMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompanySearch, setShowCompanySearch] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  useEffect(() => {
    const loadUserCompanies = async () => {
      if (!auth.currentUser) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Get all companies the user is a member of
        const membershipsQuery = query(
          collection(firestore, 'companyMembers'),
          where('userId', '==', auth.currentUser.uid)
        );
        
        const snapshot = await getDocs(membershipsQuery);
        
        // Fetch company details for each membership
        const companiesData = await Promise.all(
          snapshot.docs.map(async (memberDoc) => {
            const memberData = memberDoc.data();
            const membership = { 
              id: memberDoc.id, 
              userId: memberData.userId,
              companyId: memberData.companyId,
              status: memberData.status,
              role: memberData.role,
              ...memberData 
            } as Omit<CompanyMembership, 'company'>;
            
            const companyDoc = await getDoc(doc(firestore, 'companies', membership.companyId));
            
            if (companyDoc.exists()) {
              const companyData = companyDoc.data();
              return {
                ...membership,
                company: { 
                  id: companyDoc.id, 
                  name: companyData.name || 'Unknown Company',
                  location: companyData.location || 'No location',
                  ownerId: companyData.ownerId || ''
                }
              } as CompanyMembership;
            } else {
              return {
                ...membership,
                company: null
              } as CompanyMembership;
            }
          })
        );
        
        setCompanies(companiesData.filter(c => c.company !== null));
      } catch (error) {
        console.error('Error loading user companies:', error);
        addToast('Failed to load your companies', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserCompanies();
  }, [addToast]);
  
  const handleCompanyClick = (companyId: string, status: string) => {
    if (status !== 'active') return;
    
    // Store selected company in local storage
    localStorage.setItem('selectedCompanyId', companyId);
    // Navigate to events page
    navigate('/events');
  };
  
  const handleCompanySearchComplete = () => {
    setShowCompanySearch(false);
    // Reload companies
    setIsLoading(true);
    const loadUserCompanies = async () => {
      if (!auth.currentUser) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Get all companies the user is a member of
        const membershipsQuery = query(
          collection(firestore, 'companyMembers'),
          where('userId', '==', auth.currentUser.uid)
        );
        
        const snapshot = await getDocs(membershipsQuery);
        
        // Fetch company details for each membership
        const companiesData = await Promise.all(
          snapshot.docs.map(async (memberDoc) => {
            const memberData = memberDoc.data();
            const membership = { 
              id: memberDoc.id, 
              userId: memberData.userId,
              companyId: memberData.companyId,
              status: memberData.status,
              role: memberData.role,
              ...memberData 
            } as Omit<CompanyMembership, 'company'>;
            
            const companyDoc = await getDoc(doc(firestore, 'companies', membership.companyId));
            
            if (companyDoc.exists()) {
              const companyData = companyDoc.data();
              return {
                ...membership,
                company: { 
                  id: companyDoc.id, 
                  name: companyData.name || 'Unknown Company',
                  location: companyData.location || 'No location',
                  ownerId: companyData.ownerId || ''
                }
              } as CompanyMembership;
            } else {
              return {
                ...membership,
                company: null
              } as CompanyMembership;
            }
          })
        );
        
        setCompanies(companiesData.filter(c => c.company !== null));
      } catch (error) {
        console.error('Error loading user companies:', error);
        addToast('Failed to load your companies', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserCompanies();
  };
  
  if (isLoading) {
    return (
      <Container>
        <LoadingState>
          <FaSpinner size={30} color="#4a6cf7" />
          <p>Loading your companies...</p>
        </LoadingState>
      </Container>
    );
  }
  
  if (showCompanySearch) {
    return (
      <Container>
        <CompanySearch onComplete={handleCompanySearchComplete} />
        <Button
          onClick={() => setShowCompanySearch(false)}
          variant="text"
          fullWidth
          style={{ marginTop: '1rem' }}
        >
          Back to My Companies
        </Button>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <h2>My Companies</h2>
        <p>Select a company to view events and track time</p>
      </Header>
      
      {companies.length === 0 ? (
        <EmptyState>
          <h3>No Companies Found</h3>
          <p>You haven't joined any companies yet. Search for a company or create your own.</p>
          <Button
            onClick={() => setShowCompanySearch(true)}
            variant="primary"
            leftIcon={<FaPlus />}
            size="large"
          >
            Find a Company
          </Button>
        </EmptyState>
      ) : (
        <>
          <CompanyList>
            {companies.map(({ company, status }) => (
              <CompanyCard 
                key={company?.id}
                isActive={status === 'active'}
                onClick={() => handleCompanyClick(company?.id || '', status)}
              >
                <CompanyIcon>
                  <FaBuilding />
                </CompanyIcon>
                <CompanyDetails>
                  <h3>{company?.name}</h3>
                  <p>{company?.location}</p>
                </CompanyDetails>
                <StatusBadge status={status}>
                  {status === 'active' ? 'Active' : 
                   status === 'pending' ? 'Pending' : 'Rejected'}
                </StatusBadge>
              </CompanyCard>
            ))}
          </CompanyList>
          
          <Button
            onClick={() => setShowCompanySearch(true)}
            variant="primary"
            leftIcon={<FaPlus />}
            fullWidth
            style={{ marginTop: '1.5rem' }}
          >
            Find More Companies
          </Button>
        </>
      )}
    </Container>
  );
}

export default Dashboard; 
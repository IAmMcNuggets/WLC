import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, serverTimestamp, DocumentData } from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import styled from 'styled-components';
import Button from '../components/Button';
import { useToast } from '../contexts/ToastContext';
import { FaUser, FaCheck, FaTimes, FaBuilding, FaSpinner } from 'react-icons/fa';

const Container = styled.div`
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
  
  h2 {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #666;
    margin: 0;
  }
`;

const CompanySelector = styled.div`
  margin-bottom: 1.5rem;
  
  h3 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
    color: #555;
  }
  
  select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    background-color: white;
    
    &:focus {
      outline: none;
      border-color: #4a6cf7;
      box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.2);
    }
  }
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 1.5rem;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.5rem;
  background: ${props => props.active ? '#4a6cf7' : 'transparent'};
  color: ${props => props.active ? '#fff' : '#333'};
  border: none;
  cursor: pointer;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
`;

const RequestItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
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

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 0;
  color: #666;
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

interface CompanyMember {
  id: string;
  userId: string;
  companyId: string;
  status: 'active' | 'pending' | 'rejected';
  role: 'owner' | 'admin' | 'worker';
  requestedAt: any;
  user?: {
    displayName: string;
    email: string;
    photoURL: string;
  };
}

interface Company {
  id: string;
  name: string;
  location: string;
  ownerId: string;
}

function CompanyManagement() {
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'rejected'>('pending');
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  
  useEffect(() => {
    const loadCompanies = async () => {
      if (!auth.currentUser) return;
      
      try {
        // Get companies owned by current user
        const companiesQuery = query(
          collection(firestore, 'companies'),
          where('ownerId', '==', auth.currentUser.uid)
        );
        
        const snapshot = await getDocs(companiesQuery);
        const companyData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Company[];
        
        setCompanies(companyData);
        
        // Select the first company by default
        if (companyData.length > 0 && !selectedCompanyId) {
          setSelectedCompanyId(companyData[0].id);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
        addToast('Error loading your companies', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCompanies();
  }, [addToast, selectedCompanyId]);
  
  useEffect(() => {
    const loadMembers = async () => {
      if (!selectedCompanyId) return;
      
      setIsLoading(true);
      try {
        // Get company members with the selected status
        const membersQuery = query(
          collection(firestore, 'companyMembers'),
          where('companyId', '==', selectedCompanyId),
          where('status', '==', activeTab)
        );
        
        const snapshot = await getDocs(membersQuery);
        const memberData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as CompanyMember[];
        
        // Load user details for each member
        const membersWithUserDetails = await Promise.all(
          memberData.map(async (member) => {
            try {
              const userDoc = await getDoc(doc(firestore, 'userProfiles', member.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  ...member,
                  user: {
                    displayName: userData.displayName || 'Unknown User',
                    email: userData.email || 'No email',
                    photoURL: userData.photoURL || ''
                  }
                } as CompanyMember;
              }
              return member;
            } catch (err) {
              console.error('Error loading user details:', err);
              return member;
            }
          })
        );
        
        setMembers(membersWithUserDetails);
      } catch (error) {
        console.error('Error loading members:', error);
        addToast('Error loading membership requests', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (selectedCompanyId) {
      loadMembers();
    }
  }, [selectedCompanyId, activeTab, addToast]);
  
  const handleMemberAction = async (memberId: string, newStatus: 'active' | 'rejected') => {
    try {
      await updateDoc(doc(firestore, 'companyMembers', memberId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setMembers(prevMembers => 
        prevMembers.filter(member => member.id !== memberId)
      );
      
      addToast(`Request ${newStatus === 'active' ? 'approved' : 'rejected'} successfully`, 'success');
    } catch (error) {
      console.error('Error updating member:', error);
      addToast('Error processing request', 'error');
    }
  };
  
  if (isLoading && companies.length === 0) {
    return (
      <Container>
        <LoadingState>
          <FaSpinner size={30} color="#4a6cf7" />
          <p>Loading your companies...</p>
        </LoadingState>
      </Container>
    );
  }
  
  if (companies.length === 0) {
    return (
      <Container>
        <Header>
          <h2>Company Management</h2>
          <p>You don't own any companies yet.</p>
        </Header>
        <EmptyState>
          <p>Create a company first to manage membership requests.</p>
          <Button
            onClick={() => window.location.href = '/company-signup'}
            variant="primary"
            leftIcon={<FaBuilding />}
          >
            Create a Company
          </Button>
        </EmptyState>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <h2>Company Management</h2>
        <p>Manage membership requests and members</p>
      </Header>
      
      <CompanySelector>
        <h3>Select Company</h3>
        <select 
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
        >
          {companies.map(company => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </CompanySelector>
      
      <Tabs>
        <Tab 
          active={activeTab === 'pending'} 
          onClick={() => setActiveTab('pending')}
        >
          Pending Requests
        </Tab>
        <Tab 
          active={activeTab === 'active'} 
          onClick={() => setActiveTab('active')}
        >
          Active Members
        </Tab>
        <Tab 
          active={activeTab === 'rejected'} 
          onClick={() => setActiveTab('rejected')}
        >
          Rejected Requests
        </Tab>
      </Tabs>
      
      {isLoading ? (
        <LoadingState>
          <FaSpinner size={30} color="#4a6cf7" />
          <p>Loading requests...</p>
        </LoadingState>
      ) : (
        <>
          {members.length === 0 ? (
            <EmptyState>
              <p>No {activeTab} requests found.</p>
            </EmptyState>
          ) : (
            members.map(member => (
              <RequestItem key={member.id}>
                <UserInfo>
                  {member.user?.photoURL ? (
                    <img 
                      src={member.user.photoURL} 
                      alt={member.user.displayName || 'User'} 
                    />
                  ) : (
                    <div className="icon">
                      <FaUser />
                    </div>
                  )}
                  <div className="details">
                    <h3>{member.user?.displayName || 'Unknown User'}</h3>
                    <p>{member.user?.email || 'No email'}</p>
                    <p>Requested: {member.requestedAt?.toDate().toLocaleDateString() || 'Unknown date'}</p>
                  </div>
                </UserInfo>
                
                {activeTab === 'pending' && (
                  <Actions>
                    <Button
                      onClick={() => handleMemberAction(member.id, 'active')}
                      variant="success"
                      size="small"
                      leftIcon={<FaCheck />}
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleMemberAction(member.id, 'rejected')}
                      variant="danger"
                      size="small"
                      leftIcon={<FaTimes />}
                    >
                      Reject
                    </Button>
                  </Actions>
                )}
              </RequestItem>
            ))
          )}
        </>
      )}
    </Container>
  );
}

export default CompanyManagement; 
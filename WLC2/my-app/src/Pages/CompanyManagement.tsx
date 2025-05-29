import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, serverTimestamp, DocumentData, deleteDoc } from 'firebase/firestore';
import { firestore, auth, createUserProfile } from '../firebase';
import styled from 'styled-components';
import Button from '../components/Button';
import { useToast } from '../contexts/ToastContext';
import { FaUser, FaCheck, FaTimes, FaBuilding, FaSpinner, FaUserMinus, FaUserCog } from 'react-icons/fa';

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

const RoleSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 0.5rem;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #4a6cf7;
    box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.2);
  }
`;

interface CompanyMember {
  id: string;
  userId: string;
  companyId: string;
  status: 'active' | 'pending' | 'rejected';
  role: 'owner' | 'admin' | 'worker';
  requestedAt: any;
  userDisplayName?: string;
  userEmail?: string;
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
        setIsLoading(true);
        
        // First, get companies owned by current user
        const ownedCompaniesQuery = query(
          collection(firestore, 'companies'),
          where('ownerId', '==', auth.currentUser.uid)
        );
        
        const ownedSnapshot = await getDocs(ownedCompaniesQuery);
        const ownedCompanies = ownedSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Company[];
        
        // Then, get companies where user is an admin
        const adminMembershipsQuery = query(
          collection(firestore, 'companyMembers'),
          where('userId', '==', auth.currentUser.uid),
          where('role', '==', 'admin'),
          where('status', '==', 'active')
        );
        
        const adminMembershipsSnapshot = await getDocs(adminMembershipsQuery);
        
        // Get company IDs where user is an admin
        const adminCompanyIds = adminMembershipsSnapshot.docs.map(doc => doc.data().companyId);
        
        // Fetch the actual company details for admin companies
        const adminCompanies: Company[] = [];
        
        if (adminCompanyIds.length > 0) {
          for (const companyId of adminCompanyIds) {
            const companyDoc = await getDoc(doc(firestore, 'companies', companyId));
            if (companyDoc.exists()) {
              adminCompanies.push({
                id: companyDoc.id,
                ...companyDoc.data()
              } as Company);
            }
          }
        }
        
        // Combine owned and admin companies
        const allCompanies = [...ownedCompanies, ...adminCompanies];
        
        // Remove duplicates in case user is both owner and admin
        const uniqueCompanies = allCompanies.filter((company, index, self) =>
          index === self.findIndex(c => c.id === company.id)
        );
        
        setCompanies(uniqueCompanies);
        
        // Select the first company by default
        if (uniqueCompanies.length > 0 && !selectedCompanyId) {
          setSelectedCompanyId(uniqueCompanies[0].id);
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
  
  // Clear any existing cached profiles when component mounts
  useEffect(() => {
    localStorage.removeItem('cachedUserProfiles');
  }, []);
  
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
              // First, check if the member document already has the user info embedded
              if (member.userDisplayName && member.userEmail) {
                console.log('Using embedded user info for:', member.userId);
                return {
                  ...member,
                  user: {
                    displayName: member.userDisplayName,
                    email: member.userEmail,
                    photoURL: ''
                  }
                } as CompanyMember;
              }
              
              // Try to get user profile directly from Firestore
              const userDoc = await getDoc(doc(firestore, 'userProfiles', member.userId));
              
              if (userDoc.exists()) {
                const userData = userDoc.data();
                // Only use the profile data if it has a displayName field
                if (userData.displayName) {
                  return {
                    ...member,
                    user: {
                      displayName: userData.displayName,
                      email: userData.email || 'No email',
                      photoURL: userData.photoURL || ''
                    }
                  } as CompanyMember;
                }
              }
              
              // If we couldn't get the user profile or it doesn't have a name,
              // try to get it from Firebase Auth user data
              if (auth.currentUser) {
                // Only try this approach for active members to avoid unnecessary work
                if (activeTab === 'active') {
                  try {
                    // Try to load from Auth if possible
                    return {
                      ...member,
                      user: {
                        displayName: `Member ${member.role}`,
                        email: `ID: ${member.userId}`,
                        photoURL: ''
                      }
                    } as CompanyMember;
                  } catch (authErr) {
                    console.log('Could not get user data from Auth:', authErr);
                  }
                }
              }
              
              // Final fallback - use reasonable defaults based on member data
              return {
                ...member,
                user: {
                  displayName: member.userDisplayName || `${member.role.charAt(0).toUpperCase() + member.role.slice(1)} (${activeTab})`,
                  email: member.userEmail || `Member ID: ${member.userId.substring(0, 8)}...`,
                  photoURL: ''
                }
              } as CompanyMember;
            } catch (err) {
              console.error('Error loading user details:', err);
              
              // Return member with more meaningful placeholder info
              return {
                ...member,
                user: {
                  displayName: member.userDisplayName || `${member.role.charAt(0).toUpperCase() + member.role.slice(1)} (${activeTab})`,
                  email: member.userEmail || `Member ID: ${member.userId.substring(0, 8)}...`,
                  photoURL: ''
                }
              } as CompanyMember;
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
  
  const handleRemoveMember = async (memberId: string) => {
    // Ask for confirmation before removing the member
    if (!window.confirm('Are you sure you want to remove this member from your company?')) {
      return;
    }
    
    try {
      // Delete the company member document
      await deleteDoc(doc(firestore, 'companyMembers', memberId));
      
      // Update local state to remove the member from the list
      setMembers(prevMembers => 
        prevMembers.filter(member => member.id !== memberId)
      );
      
      addToast('Member removed successfully', 'success');
    } catch (error) {
      console.error('Error removing member:', error);
      addToast('Error removing member', 'error');
    }
  };
  
  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      // Update the member's role in Firestore
      await updateDoc(doc(firestore, 'companyMembers', memberId), {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === memberId 
            ? { ...member, role: newRole as 'owner' | 'admin' | 'worker' } 
            : member
        )
      );
      
      addToast(`Member role updated to ${newRole}`, 'success');
    } catch (error) {
      console.error('Error updating member role:', error);
      addToast('Error updating member role', 'error');
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
                    <p>
                      {activeTab === 'active' ? 
                        `Role: ${member.role.charAt(0).toUpperCase() + member.role.slice(1)}` : 
                        `Requested: ${member.requestedAt?.toDate().toLocaleDateString() || 'Unknown date'}`
                      }
                    </p>
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
                
                {activeTab === 'active' && (
                  <Actions>
                    {/* Don't allow changing owner role */}
                    {member.role !== 'owner' && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <RoleSelect
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        >
                          <option value="worker">Worker</option>
                          <option value="admin">Admin</option>
                        </RoleSelect>
                      </div>
                    )}
                    <Button
                      onClick={() => handleRemoveMember(member.id)}
                      variant="danger"
                      size="small"
                      leftIcon={<FaUserMinus />}
                    >
                      Remove
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
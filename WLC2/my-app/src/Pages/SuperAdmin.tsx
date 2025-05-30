import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { collection, query, getDocs, addDoc, serverTimestamp, doc, getDoc, orderBy, deleteDoc, updateDoc } from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import Button from '../components/Button';
import { FaPlus, FaCopy, FaTrash, FaSpinner, FaCheck, FaSignOutAlt } from 'react-icons/fa';
import { useToast } from '../contexts/ToastContext';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #666;
    margin: 0;
  }
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const Section = styled.div`
  margin-bottom: 2rem;
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
`;

const CodeGeneratorForm = styled.form`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  
  input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
`;

const CodesList = styled.div`
  margin-top: 1.5rem;
`;

const CodeItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const CodeText = styled.div`
  flex: 1;
  font-family: monospace;
  font-size: 1.1rem;
`;

const CodeStatus = styled.span<{ used: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-right: 1rem;
  background-color: ${props => props.used ? '#f8e6e6' : '#e6f7e6'};
  color: ${props => props.used ? '#c62828' : '#2c662d'};
`;

const CodeInfo = styled.div`
  margin-left: 1rem;
  font-size: 0.85rem;
  color: #666;
`;

const CodeActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  
  &:hover {
    background-color: #f5f5f5;
    color: #333;
  }
  
  &.delete {
    &:hover {
      color: #c62828;
      background-color: #ffebee;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  
  svg {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface CompanyCode {
  id: string;
  code: string;
  used: boolean;
  usedBy?: string;
  usedByName?: string;
  usedAt?: any;
  createdAt: any;
}

const SuperAdmin: React.FC = () => {
  const [codes, setCodes] = useState<CompanyCode[]>([]);
  const [codeCount, setCodeCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  // Check if user is super admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }
      
      try {
        const userProfileRef = doc(firestore, 'userProfiles', auth.currentUser.uid);
        const userProfileSnap = await getDoc(userProfileRef);
        
        if (userProfileSnap.exists() && userProfileSnap.data().isSuperAdmin === true) {
          setIsSuperAdmin(true);
          loadCodes();
        } else {
          addToast('You do not have permission to access this page', 'error');
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking super admin status:', error);
        addToast('Error checking permissions', 'error');
        navigate('/');
      }
    };
    
    checkSuperAdmin();
  }, [navigate, addToast]);
  
  const loadCodes = async () => {
    setIsLoading(true);
    
    try {
      const codesQuery = query(
        collection(firestore, 'companyCodes'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(codesQuery);
      const codesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CompanyCode[];
      
      setCodes(codesData);
    } catch (error) {
      console.error('Error loading company codes:', error);
      addToast('Error loading company codes', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateCompanyCode = (length = 8) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    // Generate three groups of characters separated by hyphens (XXX-XXX-XXX)
    for (let group = 0; group < 3; group++) {
      for (let i = 0; i < 3; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      if (group < 2) result += '-';
    }
    
    return result;
  };
  
  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSuperAdmin) {
      addToast('You do not have permission to generate codes', 'error');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const newCodes: CompanyCode[] = [];
      
      for (let i = 0; i < codeCount; i++) {
        const code = generateCompanyCode();
        
        const docRef = await addDoc(collection(firestore, 'companyCodes'), {
          code,
          used: false,
          createdAt: serverTimestamp()
        });
        
        newCodes.push({
          id: docRef.id,
          code,
          used: false,
          createdAt: new Date()
        });
      }
      
      setCodes(prevCodes => [...newCodes, ...prevCodes]);
      addToast(`Generated ${codeCount} new company code(s)`, 'success');
    } catch (error) {
      console.error('Error generating company codes:', error);
      addToast('Error generating company codes', 'error');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        addToast('Code copied to clipboard', 'success');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        addToast('Failed to copy code', 'error');
      });
  };
  
  const handleDeleteCode = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this code?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(firestore, 'companyCodes', id));
      setCodes(prevCodes => prevCodes.filter(code => code.id !== id));
      addToast('Code deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting code:', error);
      addToast('Error deleting code', 'error');
    }
  };
  
  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        navigate('/');
      })
      .catch(error => {
        console.error('Error signing out:', error);
      });
  };
  
  if (!isSuperAdmin) {
    return (
      <Container>
        <LoadingState>
          <FaSpinner size={30} />
        </LoadingState>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <h1>Super Admin Dashboard</h1>
        <p>Manage company registration codes</p>
        
        <Button 
          variant="text" 
          size="small" 
          leftIcon={<FaSignOutAlt />} 
          onClick={handleLogout}
          style={{ position: 'absolute', top: '2rem', right: '2rem' }}
        >
          Logout
        </Button>
      </Header>
      
      <Card>
        <Section>
          <h2>Generate Company Codes</h2>
          <p>Create new company registration codes to distribute to customers.</p>
          
          <CodeGeneratorForm onSubmit={handleGenerateCodes}>
            <input
              type="number"
              min="1"
              max="20"
              value={codeCount}
              onChange={(e) => setCodeCount(parseInt(e.target.value))}
              placeholder="Number of codes"
            />
            <Button
              type="submit"
              variant="primary"
              leftIcon={isGenerating ? <FaSpinner /> : <FaPlus />}
              isLoading={isGenerating}
            >
              Generate Codes
            </Button>
          </CodeGeneratorForm>
        </Section>
        
        <Section>
          <h2>Existing Codes</h2>
          
          {isLoading ? (
            <LoadingState>
              <FaSpinner size={30} />
            </LoadingState>
          ) : codes.length === 0 ? (
            <EmptyState>
              <p>No company codes found. Generate some codes to get started.</p>
            </EmptyState>
          ) : (
            <CodesList>
              {codes.map(code => (
                <CodeItem key={code.id}>
                  <CodeStatus used={code.used}>
                    {code.used ? 'Used' : 'Available'}
                  </CodeStatus>
                  <CodeText>{code.code}</CodeText>
                  {code.used && (
                    <CodeInfo>
                      Used by: {code.usedByName || code.usedBy || 'Unknown User'}
                      {code.usedAt && ` on ${new Date(code.usedAt.toDate()).toLocaleDateString()}`}
                    </CodeInfo>
                  )}
                  <CodeActions>
                    <IconButton 
                      onClick={() => handleCopyCode(code.code)}
                      title="Copy code"
                    >
                      <FaCopy />
                    </IconButton>
                    {!code.used && (
                      <IconButton 
                        onClick={() => handleDeleteCode(code.id)}
                        title="Delete code"
                        className="delete"
                      >
                        <FaTrash />
                      </IconButton>
                    )}
                  </CodeActions>
                </CodeItem>
              ))}
            </CodesList>
          )}
        </Section>
      </Card>
    </Container>
  );
};

export default SuperAdmin; 
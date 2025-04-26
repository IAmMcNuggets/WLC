import React, { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';

// Common input styling
const sharedInputStyles = css<{ $hasError?: boolean }>`
  width: 100%;
  padding: 10px 12px;
  font-size: 16px;
  border: 1px solid ${props => (props.$hasError ? '#f56565' : '#d1d5db')};
  border-radius: 6px;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${props => (props.$hasError ? '#f56565' : '#3b82f6')};
    box-shadow: 0 0 0 2px ${props => (props.$hasError ? 'rgba(245, 101, 101, 0.2)' : 'rgba(59, 130, 246, 0.2)')};
  }
  
  &:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }
`;

const InputContainer = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
`;

const StyledInput = styled.input<{ $hasError?: boolean }>`
  ${sharedInputStyles}
`;

const StyledTextarea = styled.textarea<{ $hasError?: boolean }>`
  ${sharedInputStyles}
  min-height: 100px;
  resize: vertical;
`;

const StyledSelect = styled.select<{ $hasError?: boolean }>`
  ${sharedInputStyles}
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-position: right 10px center;
  background-repeat: no-repeat;
  background-size: 20px;
  padding-right: 35px;
`;

const ErrorMessage = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: #ef4444;
`;

const HelpText = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
`;

interface FormFieldBaseProps {
  label?: string;
  name: string;
  error?: string;
  touched?: boolean;
  helpText?: string;
  required?: boolean;
}

type InputFieldProps = FormFieldBaseProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaFieldProps = FormFieldBaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;
type SelectFieldProps = FormFieldBaseProps & SelectHTMLAttributes<HTMLSelectElement> & {
  options?: Array<{
    value: string | number;
    label: string;
  }>;
};

export const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  name, 
  error, 
  touched,
  helpText,
  required,
  ...props 
}) => {
  const showError = !!error && touched;
  const inputId = `field-${name}`;
  
  return (
    <InputContainer>
      {label && (
        <Label htmlFor={inputId}>
          {label}
          {required && <span style={{ color: '#ef4444' }}> *</span>}
        </Label>
      )}
      <StyledInput 
        id={inputId}
        name={name}
        $hasError={showError}
        aria-invalid={showError}
        aria-describedby={showError ? `error-${name}` : helpText ? `help-${name}` : undefined}
        required={required}
        {...props}
      />
      {showError && <ErrorMessage id={`error-${name}`}>{error}</ErrorMessage>}
      {helpText && !showError && <HelpText id={`help-${name}`}>{helpText}</HelpText>}
    </InputContainer>
  );
};

export const TextareaField: React.FC<TextareaFieldProps> = ({ 
  label, 
  name, 
  error, 
  touched,
  helpText,
  required,
  ...props 
}) => {
  const showError = !!error && touched;
  const inputId = `field-${name}`;
  
  return (
    <InputContainer>
      {label && (
        <Label htmlFor={inputId}>
          {label}
          {required && <span style={{ color: '#ef4444' }}> *</span>}
        </Label>
      )}
      <StyledTextarea 
        id={inputId}
        name={name}
        $hasError={showError}
        aria-invalid={showError}
        aria-describedby={showError ? `error-${name}` : helpText ? `help-${name}` : undefined}
        required={required}
        {...props}
      />
      {showError && <ErrorMessage id={`error-${name}`}>{error}</ErrorMessage>}
      {helpText && !showError && <HelpText id={`help-${name}`}>{helpText}</HelpText>}
    </InputContainer>
  );
};

export const SelectField: React.FC<SelectFieldProps> = ({ 
  label, 
  name, 
  error, 
  touched,
  helpText,
  required,
  options = [],
  children,
  ...props 
}) => {
  const showError = !!error && touched;
  const inputId = `field-${name}`;
  
  return (
    <InputContainer>
      {label && (
        <Label htmlFor={inputId}>
          {label}
          {required && <span style={{ color: '#ef4444' }}> *</span>}
        </Label>
      )}
      <StyledSelect 
        id={inputId}
        name={name}
        $hasError={showError}
        aria-invalid={showError}
        aria-describedby={showError ? `error-${name}` : helpText ? `help-${name}` : undefined}
        required={required}
        {...props}
      >
        {options.length > 0 ? (
          options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        ) : (
          children
        )}
      </StyledSelect>
      {showError && <ErrorMessage id={`error-${name}`}>{error}</ErrorMessage>}
      {helpText && !showError && <HelpText id={`help-${name}`}>{helpText}</HelpText>}
    </InputContainer>
  );
};

export default {
  Input: InputField,
  Textarea: TextareaField,
  Select: SelectField
};
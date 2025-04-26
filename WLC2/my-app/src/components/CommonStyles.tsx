import styled, { css } from 'styled-components';

export const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
`;

export const ContentSection = styled.section`
  margin-bottom: 2rem;
`;

export const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 1.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
`;

export const PageSubtitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 1rem;
`;

export const SectionTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
`;

export const Flex = styled.div<{
  direction?: 'row' | 'column';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  gap?: number;
  wrap?: boolean;
}>`
  display: flex;
  flex-direction: ${({ direction }) => direction || 'row'};
  justify-content: ${({ justify }) =>
    justify === 'start'
      ? 'flex-start'
      : justify === 'end'
      ? 'flex-end'
      : justify === 'between'
      ? 'space-between'
      : justify === 'around'
      ? 'space-around'
      : justify === 'evenly'
      ? 'space-evenly'
      : justify || 'flex-start'};
  align-items: ${({ align }) =>
    align === 'start'
      ? 'flex-start'
      : align === 'end'
      ? 'flex-end'
      : align || 'center'};
  gap: ${({ gap }) => (gap ? `${gap * 0.25}rem` : '0')};
  flex-wrap: ${({ wrap }) => (wrap ? 'wrap' : 'nowrap')};
`;

export const Grid = styled.div<{
  columns?: number;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
}>`
  display: grid;
  grid-template-columns: repeat(
    ${({ columns }) => columns || 1},
    minmax(0, 1fr)
  );
  gap: ${({ gap }) => (gap ? `${gap * 0.25}rem` : undefined)};
  row-gap: ${({ rowGap }) => (rowGap ? `${rowGap * 0.25}rem` : undefined)};
  column-gap: ${({ columnGap }) =>
    columnGap ? `${columnGap * 0.25}rem` : undefined};

  @media (max-width: 768px) {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
`;

export const Text = styled.p<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right';
}>`
  font-size: ${({ size }) =>
    size === 'xs'
      ? '0.75rem'
      : size === 'sm'
      ? '0.875rem'
      : size === 'lg'
      ? '1.125rem'
      : size === 'xl'
      ? '1.25rem'
      : '1rem'};
  font-weight: ${({ weight }) =>
    weight === 'medium'
      ? 500
      : weight === 'semibold'
      ? 600
      : weight === 'bold'
      ? 700
      : 400};
  color: ${({ color }) => color || 'inherit'};
  text-align: ${({ align }) => align || 'left'};
  margin: 0;
`;

export const Badge = styled.span<{
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}>`
  display: inline-block;
  border-radius: 9999px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  
  ${({ size }) => {
    switch (size) {
      case 'sm':
        return css`
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
        `;
      case 'lg':
        return css`
          font-size: 1rem;
          padding: 0.5rem 1rem;
        `;
      case 'md':
      default:
        return css`
          font-size: 0.875rem;
          padding: 0.35rem 0.75rem;
        `;
    }
  }}
  
  ${({ variant }) => {
    switch (variant) {
      case 'success':
        return css`
          background-color: #c6f6d5;
          color: #2f855a;
        `;
      case 'warning':
        return css`
          background-color: #feebc8;
          color: #c05621;
        `;
      case 'danger':
        return css`
          background-color: #fed7d7;
          color: #c53030;
        `;
      case 'info':
        return css`
          background-color: #bee3f8;
          color: #2b6cb0;
        `;
      case 'primary':
      default:
        return css`
          background-color: #ceedff;
          color: #0084ff;
        `;
    }
  }}
`;

export const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
`;

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 1.5rem 0;
`;

export const Avatar = styled.div<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
}>`
  border-radius: 9999px;
  overflow: hidden;
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a5568;
  font-weight: 600;
  
  ${({ size }) => {
    switch (size) {
      case 'xs':
        return css`
          width: 1.5rem;
          height: 1.5rem;
          font-size: 0.625rem;
        `;
      case 'sm':
        return css`
          width: 2rem;
          height: 2rem;
          font-size: 0.75rem;
        `;
      case 'lg':
        return css`
          width: 3.5rem;
          height: 3.5rem;
          font-size: 1.5rem;
        `;
      case 'xl':
        return css`
          width: 5rem;
          height: 5rem;
          font-size: 2rem;
        `;
      case 'md':
      default:
        return css`
          width: 2.5rem;
          height: 2.5rem;
          font-size: 1rem;
        `;
    }
  }}
  
  ${({ src }) =>
    src &&
    css`
      background-image: url(${src});
      background-size: cover;
      background-position: center;
    `}
`;

export const Container = styled.div<{
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: number;
}>`
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: ${({ padding }) => (padding ? `${padding * 0.25}rem` : '1rem')};
  padding-right: ${({ padding }) => (padding ? `${padding * 0.25}rem` : '1rem')};
  
  ${({ maxWidth }) => {
    switch (maxWidth) {
      case 'sm':
        return css`
          max-width: 640px;
        `;
      case 'md':
        return css`
          max-width: 768px;
        `;
      case 'lg':
        return css`
          max-width: 1024px;
        `;
      case 'xl':
        return css`
          max-width: 1280px;
        `;
      case 'full':
      default:
        return css`
          max-width: 100%;
        `;
    }
  }}
`; 
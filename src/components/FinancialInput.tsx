'use client';

import React from 'react';
import CurrencyInput, { CurrencyInputProps } from 'react-currency-input-field';
import { Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface CustomCurrencyInputProps extends CurrencyInputProps {
  label?: string;
  error?: string;
}

const FinancialInput: React.FC<CustomCurrencyInputProps> = ({ 
  label, 
  error, 
  className,
  ...props 
}) => {
  const { i18n } = useTranslation();
  const isPt = i18n.language.startsWith('pt');
  return (
    <Form.Group className="mb-4">
      {label && <Form.Label className="fw-bold text-muted smaller text-uppercase tracking-widest mb-2">{label}</Form.Label>}
      <div className="input-group input-group-lg shadow-sm">
        <span className="input-group-text bg-light border-1 border-end-0 text-primary fw-bold px-3" style={{ borderTopLeftRadius: 'var(--radius-md)', borderBottomLeftRadius: 'var(--radius-md)' }}>
          {isPt ? 'R$' : '$'}
        </span>
        <CurrencyInput
          className={`form-control border-1 border-start-0 ps-1 fw-bold text-dark ${error ? 'is-invalid' : ''} ${className || ''}`}
          style={{ borderTopRightRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)' }}
          decimalsLimit={2}
          decimalSeparator={isPt ? ',' : '.'}
          groupSeparator={isPt ? '.' : ','}
          intlConfig={{ locale: isPt ? 'pt-BR' : 'en-US', currency: isPt ? 'BRL' : 'USD' }}
          {...props}
        />
      </div>
      {error && <div className="invalid-feedback d-block mt-2 small fw-bold text-danger">{error}</div>}
    </Form.Group>



  );
};

export default FinancialInput;

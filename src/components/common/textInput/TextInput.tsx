import { useState } from 'react';
import * as S from './TextInput.style';
import CloseIcon from '@/assets/icons/CloseIcon2.svg?react';
import EyeOffIcon from '@/assets/icons/EyeOffIcon.svg?react';
import EyeOnIcon from '@/assets/icons/EyeOnIcon.svg?react';
import ClearIcon from '@/assets/icons/ClearIcon.svg?react';
import PasswordDotIcon from '@/assets/icons/PasswordDotIcon.svg?react';
import { koToEn } from '@/utils/koToEn';

type TextInputProps = {
  value: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
  type?: 'default' | 'password';
  size?: 'sm' | 'md';
  $state?:
    | 'enable'
    | 'hover'
    | 'focus'
    | 'typing'
    | 'activated'
    | 'success'
    | 'error'
    | 'disabled'
    | 'registered';
  placeholder?: string;
  helperText?: string;
};

export const TextInput = ({
  value,
  onChange,
  onRemove,
  type,
  size = 'md',
  $state,
  placeholder = '입력하시오',
  helperText,
}: TextInputProps) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const safeState = $state ?? 'enable';
  const isPassword = type === 'password';
  const showSecureIcons = isPassword && value;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    if (isPassword) {
      inputValue = koToEn(inputValue);
    }
    onChange(inputValue);
  };

  const handleClear = () => onChange('');
  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  return (
    <S.Container size={size} $state={safeState}>
      <S.InputBox size={size} $state={safeState} $focused={focused}>
        <S.StyledInput
          type={isPassword && !showPassword ? 'password' : 'text'}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={safeState === 'disabled'}
          $state={safeState}
          style={
            isPassword && !showPassword
              ? {
                  color: 'transparent',
                  textShadow: '0 0 0 #0000',
                  caretColor: '#000',
                }
              : {}
          }
        />

        {isPassword && !showPassword && (
          <S.FakeInput size={size}>
            {[...value].map((_, i) => (
              <PasswordDotIcon key={i} />
            ))}
          </S.FakeInput>
        )}

        {showSecureIcons && (
          <>
            <S.Clear2Button
              type="button"
              onClick={handleClear}
              aria-label="입력 초기화"
              size={size}
            >
              <ClearIcon />
            </S.Clear2Button>
            <S.EyeButton type="button" size={size} onClick={togglePasswordVisibility}>
              {showPassword ? <EyeOnIcon /> : <EyeOffIcon />}
            </S.EyeButton>
          </>
        )}

        {!isPassword && value && safeState !== 'registered' && safeState !== 'activated' && (
          <S.ClearButton type="button" size={size} onClick={handleClear} aria-label="입력 초기화">
            <CloseIcon />
          </S.ClearButton>
        )}
      </S.InputBox>

      {!!helperText && <S.HelperText $state={safeState}>{helperText}</S.HelperText>}
    </S.Container>
  );
};

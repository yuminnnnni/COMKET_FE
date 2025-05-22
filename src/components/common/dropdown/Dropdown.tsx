import { useState, useRef, useEffect } from 'react';
import * as S from './Dropdown.style';
import { AnimatePresence, motion } from 'framer-motion';

import ChevronDown from '@/assets/icons/ChevronDown.svg?react';
import ChevronUp from '@/assets/icons/ChevronUp.svg?react';
import DropdownIcon from '@/assets/icons/DropdownIcon.svg?react';
import { Chip } from '@/components/common/chip/Chip';
import { CheckBox } from '@/components/common/checkbox/CheckBox';

export type DropdownOption = {
  label: string;
  value: string;
  imageSrc?: string;
  groupName?: string;
};

export type DropdownSize = 'sm' | 'md';
export type DropdownVariant =
  | 'none'
  | 'error'
  | 'disabled'
  | 'activated'
  | 'activated-chip'
  | 'activated-disabled';

export type DropdownOptionType = 'single-text' | 'single-image' | 'multi-check' | 'group-check';

interface Props {
  options: DropdownOption[];
  value?: string;
  selectedValues?: string[];
  onChange: (v: string | string[]) => void;
  placeholder: string;
  size?: DropdownSize;
  $variant?: DropdownVariant;
  iconLeft?: boolean;
  type?: DropdownOptionType;
}

export const Dropdown = ({
  options,
  value,
  selectedValues = [],
  onChange,
  placeholder,
  size = 'md',
  $variant = 'none',
  iconLeft,
  type = 'single-text',
}: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isDisabled = $variant === 'disabled' || $variant === 'activated-disabled';
  const isChip = $variant === 'activated-chip' && (value || selectedValues.length > 0);
  const isMulti = type === 'multi-check' || type === 'group-check';

  const selectedText = isMulti
    ? selectedValues
        .map(v => options.find(o => o.value === v)?.label)
        .filter(Boolean)
        .join(', ') || placeholder
    : (options.find(o => o.value === value)?.label ?? placeholder);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSingleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const handleMultiSelect = (v: string) => {
    const next = selectedValues.includes(v)
      ? selectedValues.filter(s => s !== v)
      : [...selectedValues, v];
    onChange(next);
  };

  const renderOption = (o: DropdownOption, index: number) => {
    const isSelected = selectedValues.includes(o.value);

    return (
      <S.OptionItem
        key={`${o.value}-${index}`}
        $size={size}
        selected={isSelected}
        onClick={() => (isMulti ? handleMultiSelect(o.value) : handleSingleSelect(o.value))}
      >
        <S.OptionItemContent>
          {type === 'single-image' && o.imageSrc && <S.IconCircle src={o.imageSrc} alt="icon" />}
          {isMulti ? (
            <CheckBox
              label={o.label}
              checked={isSelected}
              onChange={() => handleMultiSelect(o.value)}
            />
          ) : (
            <span>{o.label}</span>
          )}
        </S.OptionItemContent>
      </S.OptionItem>
    );
  };

  return (
    <S.Wrapper ref={ref}>
      <S.Container
        $size={size}
        $variant={$variant}
        onClick={() => !isDisabled && setOpen(prev => !prev)}
      >
        {type === 'single-image' && iconLeft && !isChip && (
          <S.IconLeft $size={size} $variant={$variant}>
            {type === 'single-image' && value ? (
              options.find(o => o.value === value)?.imageSrc ? (
                <S.IconCircle
                  src={options.find(o => o.value === value)!.imageSrc!}
                  alt="selected"
                />
              ) : (
                <DropdownIcon />
              )
            ) : (
              <DropdownIcon />
            )}
          </S.IconLeft>
        )}

        {isChip ? (
          isMulti ? (
            <S.ChipContainer>
              {selectedValues.map(v => {
                const label = options.find(o => o.value === v)?.label;
                if (!label) return null;
                return (
                  <Chip
                    key={v}
                    $variant="lightTeal"
                    $styleType={isDisabled ? 'disabled' : 'filled'}
                    size={size}
                    onClose={() => !isDisabled && onChange(selectedValues.filter(s => s !== v))}
                  >
                    {label}
                  </Chip>
                );
              })}
            </S.ChipContainer>
          ) : (
            <Chip
              $variant="lightTeal"
              $styleType={isDisabled ? 'disabled' : 'filled'}
              size={size}
              onClose={() => !isDisabled && onChange('')}
            >
              {selectedText}
            </Chip>
          )
        ) : (
          <S.TextBox $size={size} $variant={$variant}>
            {selectedText}
          </S.TextBox>
        )}

        <S.IconRight $size={size} $variant={$variant}>
          {open ? <ChevronUp /> : <ChevronDown />}
        </S.IconRight>
      </S.Container>

      <AnimatePresence>
        {open && (
          <S.OptionList
            key="dropdown"
            $size={size}
            initial={{ opacity: 0, scaleY: 0.95 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ transformOrigin: 'top' }}
          >
            {type === 'group-check'
              ? [...new Set(options.map(o => o.groupName))].map((group, idx) => (
                  <S.GroupBlock key={`${group}-${idx}`}>
                    <S.GroupLabel>{group}</S.GroupLabel>
                    {options.filter(o => o.groupName === group).map(renderOption)}
                  </S.GroupBlock>
                ))
              : options.map((o, i) => renderOption(o, i))}
          </S.OptionList>
        )}
      </AnimatePresence>
    </S.Wrapper>
  );
};

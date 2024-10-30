
import { Select, SelectOption, SelectList, MenuToggle, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities, ChipGroup, Chip, Button } from '@patternfly/react-core';
import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import { supportedLanguages } from '../Constants';

export const ProgrammingLanguagesSelect = ({ selected, handleSelectedChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [selectOptions, setSelectOptions] = React.useState(supportedLanguages);
  const [focusedItemIndex, setFocusedItemIndex] = React.useState(null);
  const [activeItemId, setActiveItemId] = React.useState(null);
  const textInputRef = React.useRef();
  const NO_RESULTS = 'no results';
  React.useEffect(() => {
    let newSelectOptions = supportedLanguages;
    if (inputValue) {
      newSelectOptions = supportedLanguages.filter(menuItem => String(menuItem.children).toLowerCase().includes(inputValue.toLowerCase()));
      if (!newSelectOptions.length) {
        newSelectOptions = [{
          isAriaDisabled: true,
          children: `No results found for "${inputValue}"`,
          value: NO_RESULTS
        }];
      }
      if (!isOpen) {
        setIsOpen(true);
      }
    }
    setSelectOptions(newSelectOptions);
  }, [inputValue]);
  const createItemId = value => `select-multi-typeahead-${value.replace(' ', '-')}`;
  const setActiveAndFocusedItem = itemIndex => {
    setFocusedItemIndex(itemIndex);
    const focusedItem = selectOptions[itemIndex];
    setActiveItemId(createItemId(focusedItem.value));
  };
  const resetActiveAndFocusedItem = () => {
    setFocusedItemIndex(null);
    setActiveItemId(null);
  };
  const closeMenu = () => {
    setIsOpen(false);
    resetActiveAndFocusedItem();
  };
  const onInputClick = () => {
    if (!isOpen) {
      setIsOpen(true);
    } else if (!inputValue) {
      closeMenu();
    }
  };
  const onSelect = value => {
    if (value && value !== NO_RESULTS) {
      console.log('selected', value);
      handleSelectedChange(selected.includes(value) ? selected.filter(selection => selection !== value) : [...selected, value]);
    }
    textInputRef.current?.focus();
  };
  const onTextInputChange = (_event, value) => {
    setInputValue(value);
    resetActiveAndFocusedItem();
  };
  const handleMenuArrowKeys = key => {
    let indexToFocus = 0;
    if (!isOpen) {
      setIsOpen(true);
    }
    if (selectOptions.every(option => option.isDisabled)) {
      return;
    }
    if (key === 'ArrowUp') {
      if (focusedItemIndex === null || focusedItemIndex === 0) {
        indexToFocus = selectOptions.length - 1;
      } else {
        indexToFocus = focusedItemIndex - 1;
      }
      while (selectOptions[indexToFocus].isDisabled) {
        indexToFocus--;
        if (indexToFocus === -1) {
          indexToFocus = selectOptions.length - 1;
        }
      }
    }
    if (key === 'ArrowDown') {
      if (focusedItemIndex === null || focusedItemIndex === selectOptions.length - 1) {
        indexToFocus = 0;
      } else {
        indexToFocus = focusedItemIndex + 1;
      }
      while (selectOptions[indexToFocus].isDisabled) {
        indexToFocus++;
        if (indexToFocus === selectOptions.length) {
          indexToFocus = 0;
        }
      }
    }
    setActiveAndFocusedItem(indexToFocus);
  };
  const onInputKeyDown = event => {
    const focusedItem = focusedItemIndex !== null ? selectOptions[focusedItemIndex] : null;
    switch (event.key) {
      case 'Enter':
        if (isOpen && focusedItem && focusedItem.value !== NO_RESULTS && !focusedItem.isAriaDisabled) {
          onSelect(focusedItem.value);
        }
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        handleMenuArrowKeys(event.key);
        break;
    }
  };
  const onToggleClick = () => {
    setIsOpen(!isOpen);
    textInputRef?.current?.focus();
  };
  const onClearButtonClick = () => {
    handleSelectedChange([]);
    setInputValue('');
    resetActiveAndFocusedItem();
    textInputRef?.current?.focus();
  };
  const getChildren = value => supportedLanguages.find(option => option.value === value)?.children;
  const toggle = toggleRef => <MenuToggle variant="typeahead" aria-label="Multi typeahead menu toggle" onClick={onToggleClick} innerRef={toggleRef} isExpanded={isOpen} isFullWidth>
    <TextInputGroup isPlain>
      <TextInputGroupMain value={inputValue} onClick={onInputClick} onChange={onTextInputChange} onKeyDown={onInputKeyDown} id="multi-typeahead-select-input" autoComplete="off" innerRef={textInputRef} placeholder="Select a programming language" {...(activeItemId && {
        'aria-activedescendant': activeItemId
      })} role="combobox" isExpanded={isOpen} aria-controls="select-multi-typeahead-listbox">
        <ChipGroup aria-label="Current selections">
          {selected.map((selection, index) => <Chip key={index} onClick={ev => {
            ev.stopPropagation();
            onSelect(selection);
          }}>
            {getChildren(selection)}
          </Chip>)}
        </ChipGroup>
      </TextInputGroupMain>
      <TextInputGroupUtilities {...selected.length === 0 ? {
        style: {
          display: 'none'
        }
      } : {}}>
        <Button variant="plain" onClick={onClearButtonClick} aria-label="Clear input value">
          <TimesIcon aria-hidden />
        </Button>
      </TextInputGroupUtilities>
    </TextInputGroup>
  </MenuToggle>;
  return <Select id="multi-typeahead-select" isOpen={isOpen} selected={selected} onSelect={(_event, selection) => onSelect(selection)} onOpenChange={isOpen => {
    !isOpen && closeMenu();
  }} toggle={toggle} shouldFocusFirstItemOnOpen={false}>
    <SelectList isAriaMultiselectable id="select-multi-typeahead-listbox">
      {selectOptions.map((option, index) => <SelectOption key={option.value || option.children} isFocused={focusedItemIndex === index} className={option.className} id={createItemId(option.value)} {...option} ref={null} />)}
    </SelectList>
  </Select>;
};
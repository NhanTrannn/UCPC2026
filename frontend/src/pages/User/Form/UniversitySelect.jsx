import { useField, useFormikContext } from 'formik';
import { useEffect, useState } from 'react';
import Select from 'react-select';

function Universities({ name, options = [] }) {
    const { setFieldValue } = useFormikContext();
    const [field, meta] = useField(name);
    const [isOther, setIsOther] = useState(false);
    const [customInputValue, setCustomInputValue] = useState('');
    const [isCustomInputFocused, setIsCustomInputFocused] = useState(false);

    const normalizeText = (text) =>
        (text ?? '')
            .toString()
            .normalize('NFC')
            .replace(/\s+/g, ' ')
            .trim();

    const toVietnameseUppercase = (text) =>
        normalizeText(text).toLocaleUpperCase('vi-VN');

    const formatOptionSchoolName = (text) => toVietnameseUppercase(text);
    const formatInputSchoolName = (text) => toVietnameseUppercase(text);

    // Lấy giá trị hiện tại từ field.value
    const currentValue = field.value;

    const formattedOptions = [
        ...options.map((univ) => {
            if (typeof univ === 'string') {
                const formatted = formatOptionSchoolName(univ);
                return { label: formatted, value: formatted };
            }
            if (typeof univ === 'object' && univ.label && univ.value) {
                const formatted = formatOptionSchoolName(univ.value);
                return { label: formatted, value: formatted };
            }
            const value = univ.name || univ.value || 'Unknown';
            const formatted = formatOptionSchoolName(value);
            return { label: formatted, value: formatted };
        }),
        { label: 'KHÁC', value: '__OTHER__' }
    ];

    const matchedOption = formattedOptions.find(
        (opt) =>
            opt.value !== '__OTHER__' &&
            normalizeText(opt.value).toLowerCase() === normalizeText(currentValue).toLowerCase()
    );
    const isCurrentOther = currentValue && !matchedOption;

    useEffect(() => {
        // Only hydrate input from form state when restoring existing custom values.
        // While focused, keep the local value as source of truth to avoid IME overwrite.
        if (isCurrentOther && !isCustomInputFocused) {
            setCustomInputValue((currentValue ?? '').toString());
        }
    }, [isCurrentOther, currentValue, isCustomInputFocused]);

    const handleSelectChange = (selectedOption) => {
        if (selectedOption?.value === '__OTHER__') {
            setIsOther(true);
            setCustomInputValue((currentValue ?? '').toString());
            setFieldValue(name, currentValue ?? '');
        } else {
            setIsOther(false);
            setCustomInputValue('');
            setFieldValue(name, formatOptionSchoolName(selectedOption?.value || ''));
        }
    };

    const handleCustomInput = (e) => {
        const typedValue = e.target.value;
        setIsOther(true);
        setCustomInputValue(typedValue);
    };

    const handleCustomInputBlur = () => {
        const normalizedTypedValue = normalizeText(customInputValue);
        const matched = formattedOptions.find(
            (opt) =>
                opt.value !== '__OTHER__' &&
                normalizeText(opt.value).toLowerCase() === normalizedTypedValue.toLowerCase()
        );

        if (matched) {
            setIsOther(false);
            setCustomInputValue('');
            setFieldValue(name, matched.value);
            return;
        }

        setIsOther(true);
        setFieldValue(name, formatInputSchoolName(customInputValue));
    };

    const selectedOption = isOther || isCurrentOther
        ? { label: 'KHÁC', value: '__OTHER__' }
        : matchedOption || formattedOptions.find((opt) => opt.value === field.value) || null;

    const fieldClassName =
        'mt-2 h-12 w-full rounded-lg border border-[#3b2f63] bg-[#1b1533] px-3 text-base font-semibold text-[#f3efff] outline-none transition placeholder:text-[#7f73ad] focus:border-[#bca4ff] focus:ring-2 focus:ring-[#bca4ff]/30 font-sans';

    return (
        <div className="mt-2 flex w-full flex-col gap-1.5">
            <Select
                id={name}
                name={name}
                options={formattedOptions}
                value={selectedOption}
                onChange={handleSelectChange}
                placeholder="Chọn trường"
                isClearable={!isOther && !isCurrentOther}
                styles={{
                    control: (base, state) => ({
                        ...base,
                        fontFamily: 'Segoe UI, Arial, sans-serif',
                        minHeight: '3rem',
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        borderWidth: '1px',
                        borderRadius: '0.5rem',
                        borderColor: state.isFocused ? '#bca4ff' : '#3b2f63',
                        boxShadow: state.isFocused ? '0 0 0 2px rgba(188, 164, 255, 0.3)' : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            borderColor: '#9c83ea',
                        },
                        backgroundColor: '#1b1533',
                        color: '#f3efff',
                    }),
                    valueContainer: (base) => ({
                        ...base,
                        padding: '0 0.5rem',
                    }),
                    placeholder: (base) => ({
                        ...base,
                        color: '#8f86b4',
                    }),
                    singleValue: (base) => ({
                        ...base,
                        color: '#f3efff',
                        fontWeight: 600,
                    }),
                    input: (base) => ({
                        ...base,
                        color: '#f3efff',
                        margin: 0,
                        padding: 0,
                    }),
                    menu: (base) => ({
                        ...base,
                        fontFamily: 'Segoe UI, Arial, sans-serif',
                        backgroundColor: '#18122f',
                        border: '1px solid #3b2f63',
                        borderRadius: '0.5rem',
                        zIndex: 50,
                    }),
                    menuList: (base) => ({
                        ...base,
                        maxHeight: '240px',
                    }),
                    option: (base, state) => ({
                        ...base,
                        color: state.isSelected ? '#f8f5ff' : '#ddd6ff',
                        fontWeight: 600,
                        backgroundColor: state.isSelected
                            ? '#4b2a88'
                            : state.isFocused
                                ? '#2d2250'
                                : '#18122f',
                        cursor: 'pointer',
                    }),
                    indicatorSeparator: (base) => ({
                        ...base,
                        backgroundColor: '#4f3c83',
                    }),
                    dropdownIndicator: (base, state) => ({
                        ...base,
                        color: state.isFocused ? '#d9c2ff' : '#9e93c8',
                        '&:hover': {
                            color: '#d9c2ff',
                        },
                    }),
                    clearIndicator: (base) => ({
                        ...base,
                        color: '#9e93c8',
                        '&:hover': {
                            color: '#f3efff',
                        },
                    }),
                }}
            />
            {(isOther || isCurrentOther) && (
                <input
                    type="text"
                    value={customInputValue}
                    onChange={handleCustomInput}
                    onFocus={() => setIsCustomInputFocused(true)}
                    onBlur={() => {
                        setIsCustomInputFocused(false);
                        handleCustomInputBlur();
                    }}
                    placeholder="Nhập tên trường của bạn"
                    className={fieldClassName}
                />
            )}
            {meta.touched && meta.error && (
                <div className="text-red-500 text-sm mt-1">{meta.error}</div>
            )}
        </div>
    );
}

export default Universities;

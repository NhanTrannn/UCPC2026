import { useField, useFormikContext } from 'formik';
import { useEffect, useState } from 'react';
import Select from 'react-select';

function Universities({ name, options = [] }) {
    const { setFieldValue } = useFormikContext();
    const [field, meta] = useField(name);
    const [isOther, setIsOther] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const [customInputValue, setCustomInputValue] = useState('');

    const normalizeText = (text) =>
        (text ?? '')
            .toString()
            .normalize('NFC')
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();

    const formatOptionSchoolName = (text) => normalizeText(text);
    const formatInputSchoolName = (text) =>
        (text ?? '')
            .toString()
            .normalize('NFC')
            .toUpperCase();

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
        { label: 'Khác', value: '__OTHER__' }
    ];

    const matchedOption = formattedOptions.find(
        (opt) =>
            opt.value !== '__OTHER__' &&
            normalizeText(opt.value) === normalizeText(currentValue)
    );
    const isCurrentOther = currentValue && !matchedOption;

    useEffect(() => {
        if ((isOther || isCurrentOther) && !isComposing) {
            setCustomInputValue((currentValue ?? '').toString());
        }
    }, [isOther, isCurrentOther, isComposing, currentValue]);

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
                normalizeText(opt.value) === normalizedTypedValue
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
        ? { label: 'Khác', value: '__OTHER__' }
        : matchedOption || formattedOptions.find((opt) => opt.value === field.value) || null;

    const fieldClassName =
        'mt-2 h-12 w-full rounded-lg border border-[#3b2f63] bg-[#1b1533] px-3 text-sm text-[#f3efff] outline-none transition placeholder:text-[#7f73ad] focus:border-[#bca4ff] focus:ring-2 focus:ring-[#bca4ff]/30';

    return (
        <div className="flex flex-col gap-1.5 w-full">
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
                        minHeight: '3rem',
                        fontSize: '1rem',
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
                    }),
                    input: (base) => ({
                        ...base,
                        color: '#f3efff',
                        margin: 0,
                        padding: 0,
                    }),
                    menu: (base) => ({
                        ...base,
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
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={(e) => {
                        setIsComposing(false);
                        setCustomInputValue(e.target.value);
                    }}
                    onBlur={handleCustomInputBlur}
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

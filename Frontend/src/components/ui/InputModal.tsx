import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface InputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void | Promise<void>;
    title: string;
    label?: string;
    description?: string;
    initialValue?: string;
    placeholder?: string;
    inputType?: string;
    confirmText?: string;
    cancelText?: string;
    required?: boolean;
}

const InputModal: React.FC<InputModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    label,
    description,
    initialValue = '',
    placeholder = '',
    inputType = 'text',
    confirmText = 'Submit',
    cancelText = 'Cancel',
    required = true
}) => {
    const [value, setValue] = useState(initialValue);
    const [loading, setLoading] = useState(false);

    // Reset value when modal opens
    useEffect(() => {
        if (isOpen) {
            setValue(initialValue);
        }
    }, [isOpen, initialValue]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (required && !value.trim()) return;

        setLoading(true);
        try {
            await onConfirm(value);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {description && (
                    <p className="text-sm text-gray-600">{description}</p>
                )}

                <div>
                    {label && (
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {label}
                        </label>
                    )}
                    <input
                        type={inputType}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                        required={required}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="submit"
                        disabled={loading || (required && !value.trim())}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default InputModal;

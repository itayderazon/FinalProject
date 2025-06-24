import { useState } from 'react';

export const useForm = ({ 
  initialValues = {}, 
  validationRules = {}, 
  onSubmit,
  transform = (data) => data 
}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setValues(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate field on blur
    if (validationRules[name]) {
      validateField(name, values[name]);
    }
  };

  const validateField = (fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return true;

    for (const rule of rules) {
      const result = rule(value, values);
      if (!result.isValid) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: result.message
        }));
        return false;
      }
    }

    setErrors(prev => ({
      ...prev,
      [fieldName]: null
    }));
    return true;
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const fieldValid = validateField(fieldName, values[fieldName]);
      if (!fieldValid) {
        isValid = false;
      }
    });

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const transformedData = transform(values);
      await onSubmit(transformedData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  const setValue = (name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const setFieldError = (name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValue,
    setFieldError,
    isValid: Object.keys(errors).length === 0 && Object.keys(touched).length > 0
  };
}; 
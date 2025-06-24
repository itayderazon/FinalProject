import React, { useState } from 'react';

const CreateMenuModal = ({ selectedDate, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_template: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Menu name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Menu name must be less than 255 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (error) {
      console.error('Error creating menu:', error);
      setErrors({ submit: error.message || 'Failed to create menu' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-menu-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Daily Menu</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="selected-date">
              <span className="date-label">Date:</span>
              <span className="date-value">{formatDate(selectedDate)}</span>
            </div>

            <div className="form-group">
              <label htmlFor="name">
                Menu Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., My Healthy Day, Meal Prep Monday"
                className={errors.name ? 'error' : ''}
                maxLength={255}
                disabled={isSubmitting}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional description for this menu..."
                rows={3}
                className={errors.description ? 'error' : ''}
                maxLength={1000}
                disabled={isSubmitting}
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_template"
                  checked={formData.is_template}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                <span className="checkbox-text">
                  Save as template
                  <small>Templates can be reused for other dates</small>
                </span>
              </label>
            </div>

            {errors.submit && (
              <div className="error-banner">
                {errors.submit}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  Creating...
                </>
              ) : (
                'Create Menu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMenuModal; 
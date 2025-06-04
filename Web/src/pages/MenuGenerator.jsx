// ====================
// src/pages/MenuGenerator.jsx - Complete Version
// ====================
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useMenuGenerator } from '../hooks/useMenuGenerator';
import MenuForm from '../components/menu/MenuForm';
import MenuResults from '../components/menu/MenuResults';
import SavedMenuCard from '../components/menu/SavedMenuCard';
import '../styles/MenuGenerator.css';

const MenuGenerator = () => {
  const { user } = useAuth();
  const {
    // State
    loading,
    generatedMenus,
    savedMenus,
    activeTab,
    formData,
    presets,
    
    // Actions
    setActiveTab,
    handleInputChange,
    applyPreset,
    generateMenu,
    saveMenu,
    deleteMenu,
    clearResults
  } = useMenuGenerator();

  return (
    <div className="menu-generator">
      <div className="menu-container">
        {/* Header */}
        <div className="menu-header">
          <h1 className="menu-title">
            <span>🍳</span>
            AI Menu Generator
          </h1>
          <p className="menu-description">
            Generate personalized meal plans based on your nutrition goals
          </p>
        </div>

        {/* Tabs */}
        <div className="menu-tabs">
          <button
            className={`tab-button ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            <span>🎯</span>
            Generate Menu
          </button>
          <button
            className={`tab-button ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <span>💾</span>
            Saved Menus ({savedMenus.length})
          </button>
        </div>

        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="menu-layout">
            {/* Left Column - Input Form */}
            <MenuForm
              formData={formData}
              handleInputChange={handleInputChange}
              applyPreset={applyPreset}
              generateMenu={generateMenu}
              clearResults={clearResults}
              loading={loading}
              generatedMenus={generatedMenus}
              presets={presets}
            />

            {/* Right Column - Generated Menus */}
            <div className="menu-results">
              <MenuResults
                loading={loading}
                generatedMenus={generatedMenus}
                generateMenu={generateMenu}
                saveMenu={saveMenu}
              />
            </div>
          </div>
        )}

        {/* Saved Menus Tab */}
        {activeTab === 'saved' && (
          <div className="saved-menus-section">
            {savedMenus.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <h3 className="empty-title">No Saved Menus Yet</h3>
                <p className="empty-description">
                  Generate some menus and save your favorites to see them here!
                </p>
                <button
                  onClick={() => setActiveTab('generate')}
                  className="empty-action-btn"
                >
                  <span>🎯</span>
                  Generate Your First Menu
                </button>
              </div>
            ) : (
              <div className="saved-menus-grid">
                {savedMenus.map((menu) => (
                  <SavedMenuCard
                    key={menu.id}
                    menu={menu}
                    onDelete={deleteMenu}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuGenerator;
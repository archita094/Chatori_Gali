import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Utensils, Star, Flame, Eye, MapPin, ChevronRight, AlertTriangle } from 'lucide-react';
import api from '../utils/api.js';

const DietaryAssistant = () => {
  const navigate = useNavigate();

  // Search parameters
  const [isVeg, setIsVeg] = useState(false);
  const [maxCalories, setMaxCalories] = useState(800);
  const [minProtein, setMinProtein] = useState(20);
  const [maxPrice, setMaxPrice] = useState(800);
  const [maxSpiceLevel, setMaxSpiceLevel] = useState(3);
  const [selectedAllergies, setSelectedAllergies] = useState([]);

  // Results & UI states
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Allergies options
  const allergyOptions = ['Peanuts', 'Gluten', 'Dairy', 'Soy', 'Nuts', 'Shellfish', 'Eggs'];

  const toggleAllergy = (allergy) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      params.append('isVeg', isVeg);
      params.append('maxCalories', maxCalories);
      params.append('minProtein', minProtein);
      params.append('maxPrice', maxPrice);
      params.append('maxSpiceLevel', maxSpiceLevel);
      if (selectedAllergies.length > 0) {
        params.append('allergies', selectedAllergies.join(','));
      }

      const { data } = await api.get(`/menu/dietary-assistant?${params.toString()}`);
      setDishes(data);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError('Could not fetch recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Run a default search on component mount so page is not empty
  useEffect(() => {
    handleSearch();
  }, []);

  const handleBookNow = (restaurantId, menuItemId) => {
    // Navigate to booking page and pass pre-order item details in state
    navigate(`/book/${restaurantId}`, {
      state: { preselectedItem: menuItemId }
    });
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <div style={styles.iconWrapper}>
          <Sparkles size={32} color="var(--primary)" />
        </div>
        <h1 style={styles.pageTitle}>AI Dietary Assistant</h1>
        <p style={styles.pageSubtitle}>
          Define your health goals, nutritional profiles, and allergies. Our culinary AI scans menus across all royal Indian heritage restaurants to recommend your perfect dishes.
        </p>
      </div>

      <div style={styles.layout}>
        {/* Left Form Panel */}
        <div style={styles.formPanel} className="glass-card card-3d">
          <h2 style={styles.panelTitle}>Dietary Preferences</h2>
          <form onSubmit={handleSearch}>
            
            {/* Veg / Non-Veg Toggle */}
            <div style={styles.formGroup}>
              <label className="form-label">Diet Category</label>
              <div style={styles.toggleContainer}>
                <button
                  type="button"
                  style={{
                    ...styles.toggleBtn,
                    background: !isVeg ? 'rgba(255,255,255,0.03)' : 'rgba(16, 185, 129, 0.15)',
                    borderColor: !isVeg ? 'var(--border-color)' : 'var(--color-success)',
                    color: !isVeg ? 'var(--text-secondary)' : 'var(--color-success)',
                  }}
                  onClick={() => setIsVeg(true)}
                >
                  Pure Veg
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.toggleBtn,
                    background: isVeg ? 'rgba(255,255,255,0.03)' : 'rgba(239, 68, 68, 0.15)',
                    borderColor: isVeg ? 'var(--border-color)' : 'var(--color-danger)',
                    color: isVeg ? 'var(--text-secondary)' : 'var(--color-danger)',
                  }}
                  onClick={() => setIsVeg(false)}
                >
                  Veg & Non-Veg
                </button>
              </div>
            </div>

            {/* Calories Slider */}
            <div style={styles.formGroup}>
              <div style={styles.sliderHeader}>
                <span className="form-label">Max Calories</span>
                <span style={styles.sliderValue}>{maxCalories} kcal</span>
              </div>
              <input
                type="range"
                min="200"
                max="1500"
                step="50"
                value={maxCalories}
                onChange={(e) => setMaxCalories(Number(e.target.value))}
                style={styles.slider}
              />
            </div>

            {/* Protein Slider */}
            <div style={styles.formGroup}>
              <div style={styles.sliderHeader}>
                <span className="form-label">Min Protein</span>
                <span style={styles.sliderValue}>{minProtein}g</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minProtein}
                onChange={(e) => setMinProtein(Number(e.target.value))}
                style={styles.slider}
              />
            </div>

            {/* Max Price Slider */}
            <div style={styles.formGroup}>
              <div style={styles.sliderHeader}>
                <span className="form-label">Max Price</span>
                <span style={styles.sliderValue}>₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="100"
                max="1500"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={styles.slider}
              />
            </div>

            {/* Spice Level Selection */}
            <div style={styles.formGroup}>
              <label className="form-label">Max Spice Tolerance</label>
              <div style={styles.spiceRow}>
                {[0, 1, 2, 3].map((level) => {
                  const isActive = maxSpiceLevel >= level;
                  return (
                    <button
                      key={level}
                      type="button"
                      style={{
                        ...styles.spiceBtn,
                        background: isActive ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.02)',
                        borderColor: isActive ? 'var(--color-warning)' : 'var(--border-color)',
                      }}
                      onClick={() => setMaxSpiceLevel(level)}
                    >
                      {level === 0 ? 'No Spice' : '🌶️'.repeat(level)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Allergies Checklist */}
            <div style={styles.formGroup}>
              <label className="form-label">Allergies / Exclusions</label>
              <div style={styles.allergyGrid}>
                {allergyOptions.map((allergy) => {
                  const isSelected = selectedAllergies.includes(allergy);
                  return (
                    <button
                      key={allergy}
                      type="button"
                      style={{
                        ...styles.allergyTag,
                        background: isSelected ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                        borderColor: isSelected ? 'var(--color-danger)' : 'var(--border-color)',
                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                      }}
                      onClick={() => toggleAllergy(allergy)}
                    >
                      {allergy}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              <Sparkles size={16} /> {loading ? 'Scanning Menus...' : 'Get AI Recommendations'}
            </button>
          </form>
        </div>

        {/* Right Recommendations Panel */}
        <div style={styles.resultsPanel}>
          {error && (
            <div style={styles.errorAlert}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={styles.loaderContainer}>
              <div style={styles.spinner} />
              <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
                Chatori Gali Culinary AI is tailoring recommendations...
              </p>
            </div>
          ) : hasSearched && dishes.length === 0 ? (
            <div style={styles.emptyContainer} className="glass-card">
              <Utensils size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <h3>No Matches Found</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0.5rem auto' }}>
                We couldn't find any dishes meeting all of your requirements. Try relaxing your protein target, calorie limits, or spice level constraints!
              </p>
            </div>
          ) : (
            <div style={styles.dishesGrid}>
              {dishes.map((item) => (
                <div key={item._id} style={styles.dishCard} className="glass-card card-3d">
                  
                  {/* Restaurant Header */}
                  <div style={styles.restaurantRow}>
                    <MapPin size={14} color="var(--primary)" />
                    <span style={styles.restaurantName}>{item.restaurant?.name}</span>
                    <span style={styles.cuisineTag}>{item.restaurant?.cuisine}</span>
                    <div style={styles.ratingRow}>
                      <Star size={12} fill="var(--primary)" color="var(--primary)" />
                      <span>{item.restaurant?.rating || '4.5'}</span>
                    </div>
                  </div>

                  {/* Food Picture + Info */}
                  <div style={styles.dishContent}>
                    <img src={item.imageUrl} alt={item.name} style={styles.dishImg} />
                    <div style={styles.dishText}>
                      <div style={styles.titleRow}>
                        <h3 style={styles.dishTitle}>{item.name}</h3>
                        <span style={styles.dishPrice}>₹{item.price.toFixed(2)}</span>
                      </div>
                      <p style={styles.dishDesc}>{item.description}</p>
                      
                      {/* Dietary Badges */}
                      <div style={styles.badgesRow}>
                        {item.dietaryInfo?.isVeg ? (
                          <span className="badge badge-success">VEG</span>
                        ) : (
                          <span className="badge badge-danger">NON-VEG</span>
                        )}
                        {item.dietaryInfo?.calories > 0 && (
                          <span style={styles.nutBadge}>{item.dietaryInfo.calories} kcal</span>
                        )}
                        {item.dietaryInfo?.protein > 0 && (
                          <span style={styles.nutBadge}>{item.dietaryInfo.protein}g Prot</span>
                        )}
                        {item.dietaryInfo?.spicyLevel > 0 && (
                          <span className="badge badge-warning">
                            {'🌶️'.repeat(item.dietaryInfo.spicyLevel)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Insight Speech Bubble */}
                  <div style={styles.aiInsightBox}>
                    <div style={styles.aiPulse} />
                    <div style={styles.aiText}>
                      <strong>Culinary AI Insight:</strong> {item.aiInsight}
                    </div>
                  </div>

                  {/* Book & Pre-order Button */}
                  <button
                    onClick={() => handleBookNow(item.restaurant?._id, item._id)}
                    className="btn btn-outline"
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '0.65rem' }}
                  >
                    Reserve Table & Pre-order this Dish <ChevronRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    paddingBottom: '5rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '3rem',
  },
  iconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(212, 175, 55, 0.08)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.25rem',
    boxShadow: 'var(--shadow-glow)',
  },
  pageTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    marginBottom: '0.75rem',
    fontFamily: 'var(--font-display)',
    color: '#ffffff',
  },
  pageSubtitle: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    maxWidth: '650px',
    margin: '0 auto',
    lineHeight: '1.6',
  },
  layout: {
    display: 'flex',
    gap: '2.5rem',
    flexWrap: 'wrap',
  },
  formPanel: {
    flex: '1 1 350px',
    maxHeight: 'fit-content',
    padding: '2rem',
    position: 'sticky',
    top: '100px',
  },
  panelTitle: {
    fontSize: '1.35rem',
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.5rem',
    color: 'var(--primary)',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  toggleContainer: {
    display: 'flex',
    gap: '0.75rem',
  },
  toggleBtn: {
    flex: 1,
    padding: '0.6rem',
    border: '1px solid',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '0.5rem',
  },
  sliderValue: {
    fontSize: '0.9rem',
    color: 'var(--primary)',
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    accentColor: 'var(--primary)',
    background: 'rgba(255, 255, 255, 0.05)',
    height: '6px',
    borderRadius: 'var(--radius-full)',
    outline: 'none',
    cursor: 'pointer',
  },
  spiceRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  spiceBtn: {
    flex: 1,
    padding: '0.5rem 0.25rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#fff',
    border: '1px solid',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    textAlign: 'center',
    minWidth: '70px',
  },
  allergyGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  allergyTag: {
    padding: '0.4rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    border: '1px solid',
    borderRadius: 'var(--radius-full)',
    cursor: 'pointer',
    background: 'transparent',
    transition: 'all var(--transition-fast)',
  },
  resultsPanel: {
    flex: '2 1 600px',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '350px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(212, 175, 55, 0.1)',
    borderTopColor: 'var(--primary)',
    borderRadius: 'var(--radius-full)',
    animation: 'spin 1s linear infinite',
  },
  emptyContainer: {
    textAlign: 'center',
    padding: '4rem 2rem',
  },
  dishesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  dishCard: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  restaurantRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    paddingBottom: '0.75rem',
  },
  restaurantName: {
    fontWeight: '700',
    color: '#fff',
  },
  cuisineTag: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '0.1rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.7rem',
  },
  ratingRow: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    color: 'var(--primary)',
    fontWeight: '700',
  },
  dishContent: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  dishImg: {
    width: '120px',
    height: '120px',
    borderRadius: 'var(--radius-md)',
    objectFit: 'cover',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  dishText: {
    flex: 1,
    minWidth: '250px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '0.25rem',
  },
  dishTitle: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  dishPrice: {
    fontSize: '1.3rem',
    fontWeight: '800',
    color: 'var(--primary)',
  },
  dishDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    marginBottom: '1rem',
  },
  badgesRow: {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  nutBadge: {
    border: '1px solid rgba(255, 215, 0, 0.22)',
    borderRadius: 'var(--radius-full)',
    padding: '0.2rem 0.65rem',
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#ffd700',
    background: 'rgba(255, 215, 0, 0.05)',
  },
  aiInsightBox: {
    background: 'rgba(212, 175, 55, 0.04)',
    border: '1px solid rgba(212, 175, 55, 0.15)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.85rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    boxShadow: 'inset 0 0 10px rgba(212, 175, 55, 0.02)',
  },
  aiPulse: {
    width: '8px',
    height: '8px',
    background: 'var(--primary)',
    borderRadius: 'var(--radius-full)',
    boxShadow: '0 0 8px var(--primary)',
    flexShrink: 0,
    animation: 'pulse 1.8s infinite',
  },
  aiText: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    lineHeight: '1.45',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: 'var(--color-danger)',
    padding: '1rem',
    borderRadius: 'var(--radius-md)',
    marginBottom: '1.5rem',
  },
};

export default DietaryAssistant;

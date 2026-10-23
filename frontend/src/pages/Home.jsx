import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import {
  Calendar, Users, MapPin, Star, ArrowRight,
  Sparkles, ShieldCheck, Heart, Search, Compass, Award, ChefHat, Flame
} from 'lucide-react';
import indianHaveliHero from '../assets/indian_haveli_hero.jpg';
import chefRajeshSharma from '../assets/chef_rajesh_sharma.jpg';
import punjabiDhabaFeast from '../assets/punjabi_dhaba_feast.jpg';
import awadhiBiryaniFeast from '../assets/awadhi_biryani_feast.jpg';
import coastalPavilion from '../assets/authentic_indian_cafe.jpg';
import CoastalLivingCanvas from '../components/CoastalLivingCanvas.jsx';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  // Minimalist Booking Controls
  const [searchLocation, setSearchLocation] = useState('All');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [guestCount, setGuestCount] = useState(2);

  // Tasting Menu & Pre-Order Cart
  const [cart, setCart] = useState({ 1: 1, 2: 1 });

  // 3D Card Tilt handler
  const handleCardTilt = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;
    card.style.transform = `perspective(850px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
  };

  const handleCardReset = (e) => {
    e.currentTarget.style.transform = 'perspective(850px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  // Fetch restaurants from backend
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const { data } = await api.get('/restaurants');
        setRestaurants(data);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  // Curated Authentic Indian Venues (North Indian + Pan-Indian coverage)
  const curatedVenues = useMemo(() => [
    {
      id: 'venue-1',
      _id: restaurants[0]?._id || 'mock-1',
      name: 'Dilli 6 Royal Haveli',
      cuisine: 'North Indian, Mughlai & Clay Tandoor',
      location: 'Chandni Chowk, Old Delhi',
      region: 'Delhi',
      category: 'North Indian',
      rating: 4.9,
      reviews: '2.4k',
      price: '$$$',
      image: indianHaveliHero,
      tag: 'Old Delhi Heritage',
      specialties: '18-hr Dal Bukhara • Purani Dilli Butter Chicken • Galouti Kebab',
      timeSlots: ['6:30 PM', '7:15 PM', '8:00 PM'],
    },
    {
      id: 'venue-2',
      _id: restaurants[1]?._id || 'mock-2',
      name: 'Pind Punjab Heritage Dhaba',
      cuisine: 'Authentic Punjabi, Amritsari Kulcha & Tandoor',
      location: 'Heritage Walk, Amritsar, Punjab',
      region: 'Punjab',
      category: 'Punjabi',
      rating: 4.8,
      reviews: '1.8k',
      price: '$$',
      image: punjabiDhabaFeast,
      tag: 'Rustic Punjabi Dhaba',
      specialties: 'Amritsari Aloo Kulcha • Sarson da Saag • Bhatti Murgh • Malai Lassi',
      timeSlots: ['6:15 PM', '7:00 PM', '7:45 PM'],
    },
    {
      id: 'venue-3',
      _id: restaurants[2]?._id || 'mock-3',
      name: 'Awadh Darbar & Dum Pukht',
      cuisine: 'Royal Awadhi Nawabi & Dum Biryani',
      location: 'Hazratganj Palace Road, Lucknow',
      region: 'Awadh',
      category: 'Awadhi',
      rating: 4.9,
      reviews: '1.5k',
      price: '$$$$',
      image: awadhiBiryaniFeast,
      tag: 'Nawabi Royalty',
      specialties: 'Earthen Handi Dum Biryani • Kakori Seekh • Shahi Tukda',
      timeSlots: ['7:00 PM', '7:45 PM', '8:30 PM'],
    },
    {
      id: 'venue-4',
      _id: restaurants[3]?._id || 'mock-4',
      name: 'Dakshin & Samudra Pavilion',
      cuisine: 'Coastal Indian, Malabar & Woodfire Catch',
      location: 'Vagator Cliff Promenade, Goa',
      region: 'Goa',
      category: 'Coastal',
      rating: 4.8,
      reviews: '1.2k',
      price: '$$$',
      image: coastalPavilion,
      tag: 'Coastal Malabar',
      specialties: 'Charred Pomfret • Malabar Prawn Curry • Mangalore Ghee Roast',
      timeSlots: ['6:30 PM', '7:30 PM', '8:15 PM'],
    },
  ], [restaurants]);

  // Filtered venues based on location dropdown and cuisine pills
  const filteredVenues = useMemo(() => {
    return curatedVenues.filter((venue) => {
      const matchLoc = searchLocation === 'All' || venue.region === searchLocation;
      const matchCuisine = selectedCuisine === 'All' || venue.category === selectedCuisine;
      return matchLoc && matchCuisine;
    });
  }, [curatedVenues, searchLocation, selectedCuisine]);

  // Signature dishes for Indian Heritage tasting showcase (rich North Indian options)
  const tastingCourses = [
    {
      id: 1,
      name: 'Royal Dal Bukhara & Truffle Garlic Naan',
      price: 480,
      desc: '18-hr slow-simmered black lentils in hand-churned white butter, paired with crisp clay-tandoor garlic naan.',
      tag: 'North Indian Legend',
      image: punjabiDhabaFeast,
    },
    {
      id: 2,
      name: 'Charcoal Bhatti Paneer Tikka Angara',
      price: 420,
      desc: 'Artisanal malai paneer cubes, degi mirch marinade, charred bell peppers, mint-anardana chutney.',
      tag: 'Tandoori Pure Veg',
      image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 3,
      name: 'Nawabi Awadhi Handi Dum Biryani',
      price: 640,
      desc: 'Aged long-grain basmati sealed in earthen clay handi, infused with saffron, rose water, and royal potli spices.',
      tag: 'Royal Dum Pukht',
      image: awadhiBiryaniFeast,
    },
    {
      id: 4,
      name: 'Patiala Royal Kesar Lassi & Shahi Phirni',
      price: 210,
      desc: 'Thick earthen-pot churned sweet lassi infused with saffron strands, paired with chilled pistachio phirni.',
      tag: 'Desi Heritage Sweet',
      image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const updateCart = (dishId, delta) => {
    setCart((prev) => {
      const current = prev[dishId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[dishId];
      } else {
        updated[dishId] = next;
      }
      return updated;
    });
  };

  const menuSubtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = tastingCourses.find((d) => d.id === Number(id));
    return sum + (item?.price || 0) * qty;
  }, 0);

  const advanceDeposit = Math.round(menuSubtotal * 0.6);

  const handleBookClick = (venueId, preferredTimeSlot) => {
    const targetTime = preferredTimeSlot || '7:15 PM';
    if (!user) {
      navigate('/login');
    } else if (user.role === 'customer') {
      navigate(`/book/${venueId}`, {
        state: {
          preferredTime: targetTime,
          date: selectedDate,
          guests: guestCount,
        },
      });
    }
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={styles.pageWrapper}>
      {/* MINIMALIST HERO: Full-Bleed High-Res Photo with Clean Editorial Typography */}
      <section style={styles.heroSection}>
        <div style={styles.heroOverlay} />

        <div style={styles.heroContainer}>
          <div style={styles.heroContent}>
            <div style={styles.eyebrowChip}>
              <Flame size={14} color="#ffd700" />
              <span>THE SOUL OF INDIAN CHARCOAL & TANDOOR</span>
            </div>

            <h1 style={styles.heroTitle}>
              Flavors of Royal Havelis & Iconic Galis.
            </h1>

            <p style={styles.heroSubtitle}>
              From sizzling Old Delhi tandoors and hearty Punjabi dhabas to fragrant Awadhi dum handis and coastal spice pavilions.
              Reserve your table with effortless precision and zero waiting.
            </p>

            {/* Minimalist Floating Booking Bar */}
            <div style={styles.minimalBookingBar}>
              <div style={styles.bookingField}>
                <label style={styles.fieldLabel}>LOCATION & CUISINE</label>
                <select
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  style={styles.fieldSelect}
                >
                  <option value="All">All Iconic Regions (Pan-India)</option>
                  <option value="Delhi">Old Delhi & Delhi NCR (Chandni Chowk)</option>
                  <option value="Punjab">Punjab & Amritsar (Heritage Dhaba)</option>
                  <option value="Awadh">Lucknow & Awadh (Nawabi Heritage)</option>
                  <option value="Goa">Goa & Coastal Malabar</option>
                </select>
              </div>

              <div style={styles.fieldDivider} />

              <div style={styles.bookingField}>
                <label style={styles.fieldLabel}>DATE</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={styles.fieldInput}
                />
              </div>

              <div style={styles.fieldDivider} />

              <div style={styles.bookingField}>
                <label style={styles.fieldLabel}>GUESTS</label>
                <div style={styles.guestCounter}>
                  <button
                    type="button"
                    onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                    style={styles.guestBtn}
                  >-</button>
                  <span style={styles.guestValue}>{guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}</span>
                  <button
                    type="button"
                    onClick={() => setGuestCount(Math.min(10, guestCount + 1))}
                    style={styles.guestBtn}
                  >+</button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => scrollTo('restaurants')}
                style={styles.heroReserveBtn}
              >
                <span>Find Table</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* DISTINCT ARCHITECTURAL HORIZON TRANSITION DIVISION */}
      <div style={styles.transitionDividerWrapper}>
        <svg
          viewBox="0 0 1440 100"
          fill="none"
          preserveAspectRatio="none"
          style={styles.transitionSvg}
        >
          {/* Layer 1: Midnight Slate horizon ridge */}
          <path
            d="M0,0 C380,65 620,15 940,55 C1180,85 1340,25 1440,45 L1440,100 L0,100 Z"
            fill="#142232"
          />
          {/* Layer 2: Radiant Royal Gold Horizon Accent Line */}
          <path
            d="M0,30 C380,85 620,38 940,75 C1180,100 1340,48 1440,65"
            stroke="#ffd700"
            strokeWidth="2.5"
            strokeOpacity="0.75"
            fill="none"
          />
          {/* Layer 3: Base Pastel Dark Blue Ocean Body */}
          <path
            d="M0,30 C380,85 620,38 940,75 C1180,100 1340,48 1440,65 L1440,100 L0,100 Z"
            fill="#1c2d42"
          />
        </svg>
      </div>

      {/* PASTEL DARK BLUE LIVING CANVASES ZONE */}
      <div style={styles.livingBlueZoneWrapper}>
        {/* Kinetic Indian Teak Jali Canvas with Yellow Grid and Golden Cursor Spotlight */}
        <CoastalLivingCanvas timeMode="twilight" />

        {/* SECTION 1: CURATED SANCTUARIES (Minimalist Restaurant Cards) */}
        <section style={styles.sectionContainer} id="restaurants">
          <div style={styles.sectionHeader}>
            <span style={styles.sectionEyebrow}>AUTHENTIC INDIAN DESTINATIONS</span>
            <h2 style={styles.sectionTitle}>Tables Across India's Legendary Food Streets</h2>
            <p style={styles.sectionSubtitle}>
              From Old Delhi havelis and Amritsari dhabas to Nawabi Lucknow courts and coastal spice pavilions.
            </p>

            {/* Interactive Cuisine Filter Tabs */}
            <div style={styles.filterTabsRow}>
              {[
                { id: 'All', label: '🌟 All Heritage Tables' },
                { id: 'North Indian', label: '🏛️ North Indian & Mughlai' },
                { id: 'Punjabi', label: '🌾 Punjabi Dhaba' },
                { id: 'Awadhi', label: '👑 Awadhi Dum Pukht' },
                { id: 'Coastal', label: '🌊 Coastal Malabar' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCuisine(tab.id)}
                  style={{
                    ...styles.filterTabBtn,
                    ...(selectedCuisine === tab.id ? styles.filterTabBtnActive : {}),
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.venuesGrid}>
            {filteredVenues.map((venue) => (
              <article
                key={venue.id}
                style={styles.venueCard}
                className="tilt-card-container"
                onMouseMove={handleCardTilt}
                onMouseLeave={handleCardReset}
              >
                <div style={styles.venueImageContainer}>
                  <img src={venue.image} alt={venue.name} style={styles.venueImage} />
                  <button
                    onClick={() => toggleFavorite(venue.id)}
                    style={styles.favBtn}
                    aria-label="Favorite"
                  >
                    <Heart
                      size={16}
                      fill={favorites.includes(venue.id) ? '#ef4444' : 'none'}
                      color={favorites.includes(venue.id) ? '#ef4444' : '#fff'}
                    />
                  </button>
                  <div style={styles.venueTagPill}>
                    <span>{venue.tag}</span>
                  </div>
                  <div style={styles.venueRatingTag}>
                    <Star size={13} fill="#ffd700" color="#ffd700" />
                    <span>{venue.rating}</span>
                    <span style={{ opacity: 0.7, fontSize: '0.72rem' }}>({venue.reviews})</span>
                  </div>
                </div>

                <div style={styles.venueContent}>
                  <div style={styles.venueTitleRow}>
                    <h3 style={styles.venueName}>{venue.name}</h3>
                    <span style={styles.venuePrice}>{venue.price}</span>
                  </div>

                  <p style={styles.venueCuisine}>{venue.cuisine}</p>

                  <div style={styles.venueLocationRow}>
                    <MapPin size={14} color="#71879d" />
                    <span>{venue.location}</span>
                  </div>

                  <div style={styles.venueSpecialtiesRow}>
                    <span style={styles.specialtiesLabel}>Signatures:</span>
                    <p style={styles.specialtiesText}>{venue.specialties}</p>
                  </div>

                  <div style={styles.timeSlotsRow}>
                    <span style={styles.timeSlotLabel}>Available Tonight:</span>
                    <div style={styles.timeSlotsGroup}>
                      {venue.timeSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => handleBookClick(venue._id, slot)}
                          style={styles.timeSlotChip}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleBookClick(venue._id, venue.timeSlots[0])}
                    style={styles.venueReserveBtn}
                  >
                    <span>Reserve This Table</span>
                    <ArrowRight size={15} color="#ffd700" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SECTION 2: THE CHEF'S TASTING (Minimalist Culinary Narrative & 4-Course Pre-Order) */}
        <section style={styles.sectionContainer} id="curated-menu">
          <div style={styles.sectionHeader}>
            <span style={styles.sectionEyebrow}>CHEF’S HERITAGE TASTING</span>
            <h2 style={styles.sectionTitle}>The Soul of Charcoal & Slow Dum</h2>
            <p style={styles.sectionSubtitle}>
              Pre-order signature North Indian & regional masterworks for immediate service upon arrival. 60% advance deposit confirms your table.
            </p>
          </div>

          <div style={styles.tastingExperienceGrid}>
            {/* Left: Chef's Craft Profile */}
            <div
              style={styles.chefCraftCard}
              className="tilt-card-container"
              onMouseMove={handleCardTilt}
              onMouseLeave={handleCardReset}
            >
              <div style={styles.chefPhotoWrapper}>
                <img src={chefRajeshSharma} alt="Executive Chef Rajesh Sharma" style={styles.chefPhoto} />
                <div style={styles.michelinPill}>
                  <Award size={14} color="#ffd700" />
                  <span>MICHELIN MASTER 2026</span>
                </div>
              </div>

              <div style={styles.chefTextContent}>
                <span style={styles.chefSubtitle}>ROYAL CULINARY PHILOSOPHY</span>
                <h3 style={styles.chefHeading}>Live Bhatti Embers & Slow Dum Pukht</h3>
                <p style={styles.chefParagraph}>
                  "At Chatori Gali, we honour the timeless soul of Indian kitchens—from 18-hour slow-cooked Dal Bukhara simmered with churned white butter, to smokey Bhatti Paneer Tikka kissed by live charcoal embers and fragrant basmati sealed in earthen clay handis. Pre-ordering ensures your gravies, biryanis, and tandoori naans arrive piping hot and unhurried the moment you take your seat."
                </p>
                <div style={styles.chefSignatureRow}>
                  <div>
                    <strong style={styles.chefName}>Rajesh Sharma</strong>
                    <span style={styles.chefRole}>Culinary Director & Grand Master of Indian Tandoor</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: 4 Minimalist Tasting Courses with Clean Steppers */}
            <div style={styles.tastingCoursesColumn}>
              <div style={styles.coursesList}>
                {tastingCourses.map((dish) => (
                  <div
                    key={dish.id}
                    style={styles.courseItemCard}
                    className="tilt-card-container"
                    onMouseMove={handleCardTilt}
                    onMouseLeave={handleCardReset}
                  >
                    <img src={dish.image} alt={dish.name} style={styles.courseThumb} />

                    <div style={styles.courseDetails}>
                      <div style={styles.courseHeaderRow}>
                        <h4 style={styles.courseName}>{dish.name}</h4>
                        <span style={styles.coursePrice}>₹{dish.price}</span>
                      </div>
                      <p style={styles.courseDesc}>{dish.desc}</p>
                      <span style={styles.courseTag}>{dish.tag}</span>
                    </div>

                    <div style={styles.courseAction}>
                      {cart[dish.id] ? (
                        <div style={styles.stepper}>
                          <button onClick={() => updateCart(dish.id, -1)} style={styles.stepperBtn}>-</button>
                          <span style={styles.stepperValue}>{cart[dish.id]}</span>
                          <button onClick={() => updateCart(dish.id, 1)} style={styles.stepperBtn}>+</button>
                        </div>
                      ) : (
                        <button onClick={() => updateCart(dish.id, 1)} style={styles.addCourseBtn}>
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Minimalist Reservation Subtotal Bar */}
              <div style={styles.minimalSummaryBar}>
                <div style={styles.summaryInfo}>
                  <div style={styles.summaryTotalRow}>
                    <span style={styles.summaryLabel}>Pre-Order Total ({Object.values(cart).reduce((a, b) => a + b, 0)} items):</span>
                    <strong style={styles.summaryTotal}>₹{menuSubtotal}</strong>
                  </div>
                  <div style={styles.depositNoteRow}>
                    <ShieldCheck size={14} color="#ffd700" />
                    <span>60% Advance Deposit Required: <strong>₹{advanceDeposit}</strong> (Balance at table)</span>
                  </div>
                </div>

                <button
                  onClick={() => handleBookClick(curatedVenues[0]._id, '7:15 PM')}
                  style={styles.confirmPreOrderBtn}
                >
                  <span>Confirm Table & Pre-Order</span>
                  <ArrowRight size={15} color="#ffd700" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* MINIMALIST FOOTER */}
        <footer style={styles.footer}>
          <div style={styles.footerInner}>
            <div style={styles.footerBrand}>
              <span style={styles.footerLogo}>CHATORI <span style={{ color: '#ffd700', fontStyle: 'italic' }}>GALI</span></span>
              <p style={styles.footerMotto}>Iconic Indian dining, royal tandoor feasts & regional heritage tables.</p>
            </div>

            <div style={styles.footerLinks}>
              <a href="#restaurants" style={styles.footerLink}>Heritage Tables</a>
              <a href="#curated-menu" style={styles.footerLink}>Chef's Tasting</a>
              <button
                onClick={() => {
                  const trigger = document.getElementById('ai-concierge-trigger');
                  if (trigger) trigger.click();
                }}
                style={styles.footerConciergeBtn}
              >
                AI Concierge
              </button>
            </div>

            <div style={styles.footerCopyright}>
              © 2026 Chatori Gali. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    width: '100%',
    overflowX: 'hidden',
    backgroundColor: '#1c2d42', // Rich pastel dark blue canvas
  },

  /* Minimalist Hero */
  heroSection: {
    position: 'relative',
    width: '100%',
    minHeight: '84vh',
    backgroundImage: `url(${indianHaveliHero})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center 35%',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '6rem',
    paddingBottom: '3rem',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(10, 18, 30, 0.72)', // Warm deep twilight wash
    zIndex: 1,
  },
  heroContainer: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '1060px',
    width: '100%',
    margin: '0 auto',
    padding: '2rem',
    textAlign: 'center',
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  eyebrowChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    padding: '0.4rem 1.1rem',
    backgroundColor: 'rgba(20, 34, 50, 0.75)',
    border: '1px solid rgba(255, 215, 0, 0.5)',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.74rem',
    fontWeight: '800',
    letterSpacing: '0.12em',
    color: '#ffd700',
    marginBottom: '1.25rem',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
  },
  heroTitle: {
    fontSize: 'clamp(2.4rem, 4.8vw, 4rem)',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.02em',
    lineHeight: 1.18,
    margin: '0 0 1rem 0',
    textShadow: '0 4px 20px rgba(0, 0, 0, 0.55)',
  },
  heroSubtitle: {
    fontSize: 'clamp(1rem, 1.6vw, 1.15rem)',
    color: '#e2e8f0',
    maxWidth: '720px',
    lineHeight: 1.65,
    margin: '0 0 2.25rem 0',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
  },

  /* Minimalist Floating Booking Bar */
  minimalBookingBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    backdropFilter: 'blur(12px)',
    border: '1.5px solid rgba(255, 215, 0, 0.65)',
    borderRadius: 'var(--radius-full)',
    padding: '0.55rem 0.65rem 0.55rem 1.6rem',
    maxWidth: '860px',
    width: '100%',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  bookingField: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.15rem',
  },
  fieldLabel: {
    fontSize: '0.62rem',
    fontWeight: '800',
    letterSpacing: '0.1em',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  fieldSelect: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#142232',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: '0.2rem 0',
  },
  fieldInput: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#142232',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: '0.2rem 0',
  },
  fieldDivider: {
    width: '1px',
    height: '28px',
    backgroundColor: 'rgba(20, 34, 50, 0.12)',
  },
  guestCounter: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  guestBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '1px solid rgba(20, 34, 50, 0.2)',
    backgroundColor: '#ffffff',
    color: '#142232',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestValue: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#142232',
  },
  heroReserveBtn: {
    backgroundColor: '#142232',
    color: '#ffffff',
    border: '1.5px solid rgba(255, 215, 0, 0.5)',
    borderRadius: 'var(--radius-full)',
    padding: '0.8rem 1.6rem',
    fontSize: '0.92rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 16px rgba(20, 34, 50, 0.35)',
  },

  /* Distinct Architectural Horizon Transition Division */
  transitionDividerWrapper: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#142232',
    lineHeight: 0,
    zIndex: 2,
  },
  transitionSvg: {
    width: '100%',
    height: '75px',
    display: 'block',
  },

  /* Pastel Dark Blue Living Canvas Zone */
  livingBlueZoneWrapper: {
    position: 'relative',
    backgroundColor: '#1c2d42', // Pastel Dark Blue
    overflow: 'hidden',
    width: '100%',
    paddingBottom: '2rem',
  },

  /* Section Styles */
  sectionContainer: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '4rem 2rem 4rem 2rem',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '2.5rem',
  },
  sectionEyebrow: {
    fontSize: '0.74rem',
    fontWeight: '800',
    letterSpacing: '0.14em',
    color: '#ffd700',
    display: 'block',
    marginBottom: '0.4rem',
  },
  sectionTitle: {
    fontSize: 'clamp(2rem, 3.2vw, 2.7rem)',
    color: '#ffffff',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.01em',
    margin: '0 0 0.5rem 0',
  },
  sectionSubtitle: {
    fontSize: '0.96rem',
    color: '#cbd5e1',
    maxWidth: '640px',
    margin: '0 auto 1.5rem auto',
    lineHeight: 1.6,
  },

  /* Filter Tabs Row */
  filterTabsRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.65rem',
    flexWrap: 'wrap',
    marginTop: '1.25rem',
  },
  filterTabBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 215, 0, 0.25)',
    color: '#cbd5e1',
    borderRadius: 'var(--radius-full)',
    padding: '0.45rem 1.1rem',
    fontSize: '0.84rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  filterTabBtnActive: {
    backgroundColor: '#ffd700',
    color: '#142232',
    border: '1px solid #ffd700',
    fontWeight: '800',
    boxShadow: '0 4px 14px rgba(255, 215, 0, 0.3)',
  },

  /* Minimalist Restaurant Cards */
  venuesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '2.25rem',
  },
  venueCard: {
    backgroundColor: '#ffffff',
    borderRadius: '26px',
    border: '1.5px solid rgba(229, 192, 92, 0.35)',
    overflow: 'hidden',
    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.15s ease, box-shadow 0.2s ease',
  },
  venueImageContainer: {
    position: 'relative',
    height: '240px',
    width: '100%',
    overflow: 'hidden',
  },
  venueImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  favBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    border: 'none',
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
  },
  venueTagPill: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    backgroundColor: 'rgba(20, 34, 50, 0.92)',
    color: '#ffd700',
    border: '1px solid rgba(255, 215, 0, 0.4)',
    borderRadius: 'var(--radius-full)',
    padding: '0.25rem 0.75rem',
    fontSize: '0.72rem',
    fontWeight: '800',
    letterSpacing: '0.04em',
  },
  venueRatingTag: {
    position: 'absolute',
    bottom: '1rem',
    left: '1rem',
    backgroundColor: 'rgba(20, 34, 50, 0.92)',
    color: '#ffffff',
    borderRadius: 'var(--radius-full)',
    padding: '0.3rem 0.75rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.8rem',
    fontWeight: '700',
  },
  venueContent: {
    padding: '1.75rem',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  venueTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '0.35rem',
  },
  venueName: {
    fontSize: '1.35rem',
    fontWeight: '800',
    color: '#142232',
    fontFamily: 'var(--font-display)',
    margin: 0,
  },
  venuePrice: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#64748b',
  },
  venueCuisine: {
    fontSize: '0.88rem',
    color: '#475569',
    margin: '0 0 0.5rem 0',
    fontWeight: '600',
  },
  venueLocationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.82rem',
    color: '#64748b',
    marginBottom: '0.85rem',
  },
  venueSpecialtiesRow: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '0.65rem 0.85rem',
    marginBottom: '1.25rem',
    border: '1px solid #e2e8f0',
  },
  specialtiesLabel: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#3b82f6',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: '0.2rem',
  },
  specialtiesText: {
    fontSize: '0.78rem',
    color: '#334155',
    margin: 0,
    lineHeight: 1.4,
  },
  timeSlotsRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
    marginBottom: '1.5rem',
  },
  timeSlotLabel: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '0.04em',
  },
  timeSlotsGroup: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  timeSlotChip: {
    backgroundColor: '#f1f5f9',
    border: '1px solid rgba(20, 34, 50, 0.12)',
    borderRadius: 'var(--radius-full)',
    padding: '0.35rem 0.85rem',
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#142232',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  venueReserveBtn: {
    marginTop: 'auto',
    backgroundColor: '#142232',
    color: '#ffffff',
    border: '1.5px solid rgba(255, 215, 0, 0.4)',
    borderRadius: 'var(--radius-full)',
    padding: '0.85rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontSize: '0.92rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(20, 34, 50, 0.25)',
  },

  /* Minimalist Tasting Experience (2-Column) */
  tastingExperienceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.25fr',
    gap: '2.5rem',
    alignItems: 'start',
  },
  chefCraftCard: {
    backgroundColor: '#ffffff',
    borderRadius: '26px',
    border: '1.5px solid rgba(229, 192, 92, 0.35)',
    overflow: 'hidden',
    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
  },
  chefPhotoWrapper: {
    position: 'relative',
    height: '280px',
    width: '100%',
  },
  chefPhoto: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  michelinPill: {
    position: 'absolute',
    bottom: '1rem',
    left: '1rem',
    backgroundColor: 'rgba(20, 34, 50, 0.94)',
    color: '#ffffff',
    border: '1px solid rgba(255, 215, 0, 0.4)',
    borderRadius: 'var(--radius-full)',
    padding: '0.4rem 0.9rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.72rem',
    fontWeight: '800',
    letterSpacing: '0.06em',
  },
  chefTextContent: {
    padding: '2rem',
  },
  chefSubtitle: {
    fontSize: '0.68rem',
    fontWeight: '800',
    letterSpacing: '0.1em',
    color: '#b89020',
    display: 'block',
    marginBottom: '0.35rem',
  },
  chefHeading: {
    fontSize: '1.4rem',
    color: '#142232',
    fontFamily: 'var(--font-display)',
    margin: '0 0 0.85rem 0',
  },
  chefParagraph: {
    fontSize: '0.9rem',
    color: '#475569',
    lineHeight: 1.65,
    fontStyle: 'italic',
    margin: '0 0 1.25rem 0',
  },
  chefSignatureRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '1rem',
  },
  chefName: {
    display: 'block',
    fontSize: '0.95rem',
    color: '#142232',
  },
  chefRole: {
    fontSize: '0.78rem',
    color: '#64748b',
  },

  /* Tasting Courses Column */
  tastingCoursesColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  coursesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  courseItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1.5px solid rgba(229, 192, 92, 0.35)',
    padding: '1.15rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.25)',
  },
  courseThumb: {
    width: '74px',
    height: '74px',
    borderRadius: '14px',
    objectFit: 'cover',
    flexShrink: 0,
  },
  courseDetails: {
    flex: 1,
  },
  courseHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '0.2rem',
  },
  courseName: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#142232',
    margin: 0,
  },
  coursePrice: {
    fontSize: '0.94rem',
    fontWeight: '800',
    color: '#142232',
  },
  courseDesc: {
    fontSize: '0.8rem',
    color: '#64748b',
    margin: '0 0 0.35rem 0',
    lineHeight: 1.4,
  },
  courseTag: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#30AFFF',
    backgroundColor: 'rgba(48, 175, 255, 0.1)',
    padding: '0.15rem 0.5rem',
    borderRadius: 'var(--radius-full)',
  },
  courseAction: {
    flexShrink: 0,
  },
  addCourseBtn: {
    backgroundColor: '#f1f5f9',
    border: '1px solid rgba(20, 34, 50, 0.18)',
    borderRadius: 'var(--radius-full)',
    padding: '0.45rem 0.95rem',
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#142232',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: '#edf2f7',
    padding: '0.25rem 0.5rem',
    borderRadius: 'var(--radius-full)',
    border: '1px solid rgba(20, 34, 50, 0.15)',
  },
  stepperBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#ffffff',
    color: '#142232',
    fontWeight: '800',
    cursor: 'pointer',
  },
  stepperValue: {
    fontSize: '0.84rem',
    fontWeight: '700',
    color: '#142232',
    minWidth: '16px',
    textAlign: 'center',
  },

  /* Minimalist Pre-Order Summary Bar */
  minimalSummaryBar: {
    backgroundColor: '#ffffff',
    borderRadius: '22px',
    border: '1.5px solid rgba(229, 192, 92, 0.35)',
    padding: '1.35rem 1.6rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  summaryInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  summaryTotalRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
  },
  summaryLabel: {
    fontSize: '0.86rem',
    color: '#475569',
  },
  summaryTotal: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#142232',
  },
  depositNoteRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.78rem',
    color: '#334155',
    fontWeight: '600',
  },
  confirmPreOrderBtn: {
    backgroundColor: '#142232',
    color: '#ffffff',
    border: '1.5px solid rgba(255, 215, 0, 0.45)',
    borderRadius: 'var(--radius-full)',
    padding: '0.85rem 1.45rem',
    fontSize: '0.9rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    boxShadow: '0 4px 14px rgba(20, 34, 50, 0.25)',
  },

  /* Minimalist Footer */
  footer: {
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    marginTop: '4rem',
    padding: '3rem 2rem 2rem 2rem',
  },
  footerInner: {
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  footerBrand: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  footerLogo: {
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '1.4rem',
    color: '#ffffff',
    letterSpacing: '0.04em',
  },
  footerMotto: {
    fontSize: '0.82rem',
    color: '#8b9dae',
    margin: 0,
  },
  footerLinks: {
    display: 'flex',
    gap: '1.75rem',
    alignItems: 'center',
  },
  footerLink: {
    color: '#c2d1df',
    textDecoration: 'none',
    fontSize: '0.86rem',
    fontWeight: '600',
  },
  footerConciergeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ffd700',
    fontSize: '0.86rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  footerCopyright: {
    fontSize: '0.78rem',
    color: '#657788',
    width: '100%',
    textAlign: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '1.5rem',
    marginTop: '1.5rem',
  },
};

export default Home;

// ===== js/global.js =====
// Global utilities used across all pages

// Hamburger nav toggle
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// Mark active nav link
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link, .sidebar-link').forEach(link => {
  const href = link.getAttribute('href') || '';
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// Toast notification system
window.showToast = function(message, type = 'info', duration = 3000) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
};

// Format date helpers
window.formatDate = function(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
};

window.todayStr = function() {
  return new Date().toISOString().split('T')[0];
};

// Get days ago
window.daysAgo = function(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

// Calculate streak from completions
window.calcStreak = function(completionDates) {
  if (!completionDates || completionDates.length === 0) return 0;
  const sorted = [...new Set(completionDates)].sort().reverse();
  let streak = 0;
  let check = new Date();
  check.setHours(0, 0, 0, 0);

  for (const dateStr of sorted) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diff = (check - d) / (1000 * 60 * 60 * 24);
    if (diff <= 1) {
      streak++;
      check = d;
    } else {
      break;
    }
  }
  return streak;
};

// Local storage helpers (fallback when not connected to Supabase)
window.localDB = {
  getHabits() {
    return JSON.parse(localStorage.getItem('rootine_habits') || '[]');
  },
  saveHabits(habits) {
    localStorage.setItem('rootine_habits', JSON.stringify(habits));
  },
  getCompletions() {
    return JSON.parse(localStorage.getItem('rootine_completions') || '{}');
  },
  saveCompletions(completions) {
    localStorage.setItem('rootine_completions', JSON.stringify(completions));
  },
  toggleCompletion(habitId, date) {
    const completions = this.getCompletions();
    const key = `${habitId}_${date}`;
    if (completions[key]) {
      delete completions[key];
      this.saveCompletions(completions);
      return false;
    } else {
      completions[key] = true;
      this.saveCompletions(completions);
      return true;
    }
  },
  isCompleted(habitId, date) {
    const completions = this.getCompletions();
    return !!completions[`${habitId}_${date}`];
  },
  getCompletedDates(habitId) {
    const completions = this.getCompletions();
    return Object.keys(completions)
      .filter(k => k.startsWith(habitId + '_'))
      .map(k => k.replace(habitId + '_', ''));
  }
};

// Demo seed data
window.seedDemoData = function() {
  const existing = localDB.getHabits();
  if (existing.length > 0) return;

  const habits = [
    { id: 'h1', name: 'Morning Pages', emoji: '📓', category: 'mind', frequency: 'daily', desc: 'Write 3 pages of stream-of-consciousness journaling', created_at: daysAgo(30) },
    { id: 'h2', name: '10,000 Steps', emoji: '🚶', category: 'body', frequency: 'daily', desc: 'Walk 10k steps or more each day', created_at: daysAgo(25) },
    { id: 'h3', name: 'Read 30 mins', emoji: '📚', category: 'mind', frequency: 'daily', desc: 'Read a physical book for at least 30 minutes', created_at: daysAgo(20) },
    { id: 'h4', name: 'Meditate', emoji: '🧘', category: 'mind', frequency: 'daily', desc: '10 minute guided or silent meditation', created_at: daysAgo(15) },
    { id: 'h5', name: 'Cold Shower', emoji: '🚿', category: 'body', frequency: 'daily', desc: 'End shower with 60 seconds of cold water', created_at: daysAgo(10) },
    { id: 'h6', name: 'No Sugar', emoji: '🍎', category: 'nutrition', frequency: 'daily', desc: 'Avoid added sugars for the full day', created_at: daysAgo(7) },
  ];
  localDB.saveHabits(habits);

  // Seed some completions
  const completions = {};
  habits.forEach(h => {
    for (let i = 0; i < 30; i++) {
      if (Math.random() > 0.3) {
        const date = daysAgo(i);
        completions[`${h.id}_${date}`] = true;
      }
    }
  });
  // Ensure today has some
  ['h1', 'h2'].forEach(id => {
    completions[`${id}_${todayStr()}`] = true;
  });
  localDB.saveCompletions(completions);
};

// Trigger seed on load
window.seedDemoData();

// Animate elements on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .stat-card, .analytics-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// Add CSS for visible state
const style = document.createElement('style');
style.textContent = '.visible { opacity: 1 !important; transform: translateY(0) !important; }';
document.head.appendChild(style);

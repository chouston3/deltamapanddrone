// Delta Map and Drone — main.js

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Sticky header shadow on scroll
const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 10) {
    header.style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)';
  } else {
    header.style.boxShadow = 'none';
  }
}, { passive: true });

// Contact form submission
const form = document.getElementById('contactForm');
const status = document.getElementById('form-status');

if (form) {
    form.addEventListener('submit', async function(e) {
          e.preventDefault();
          const btn = form.querySelector('button[type="submit"]');
          btn.disabled = true;
          btn.textContent = 'Sending...';
          status.className = 'form-status';
          status.textContent = '';

                              const formData = new FormData(form);
          const data = Object.fromEntries(formData);

                              try {
                                      const res = await fetch('https://api.web3forms.com/submit', {
                                                method: 'POST',
                                                headers: {
                                                            'Content-Type': 'application/json',
                                                            'Accept': 'application/json'
                                                },
                                                body: JSON.stringify(data),
                                      });
                                      const result = await res.json();
                                      if (result.success) {
                                                status.className = 'form-status success';
                                                status.textContent = 'Message sent. We will be in touch.';
                                                form.reset();
                                      } else {
                                                throw new Error(result.message || 'Server error');
                                      }
                              } catch (err) {
                                      status.className = 'form-status error';
                                      status.textContent = 'Something went wrong. Email us directly at chip@deltamapdrone.com';
                              } finally {
                                      btn.disabled = false;
                                      btn.textContent = 'Send →';
                              }
    });
}
